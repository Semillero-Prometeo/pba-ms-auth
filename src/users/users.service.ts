import { forwardRef, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { UpdateAuthUserDto, UpdateUserDto } from './dto/update-user.dto';
import { isUUID } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { FindAllUsersQueryDto, FindByIdsOrRoleQueryDto } from './dto/find-all-user.dto';
import * as bcrypt from 'bcrypt';
import { InactiveUserDto } from './dto/delete-user.dto';
import { RpcException } from '@nestjs/microservices';
import { RequestUserDto } from 'src/core/dto/request-user.dto';
import { UserResponse } from './interfaces/user';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    @Inject(forwardRef(() => RolesService)) private readonly rolesService: RolesService,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  findAll(query: FindAllUsersQueryDto) {
    return this.userRepository.findAll(query);
  }

  findOne(unique: string, includePassword = false) {
    return this.userRepository.findOne(unique, includePassword);
  }

  async create(data: CreateUserDto) {
    const user: UserResponse | null = await this.userRepository.findOne(data.username);

    if (user && !user.deleted_at) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario ya existe',
      });
    }

    if (user?.deleted_at) {
      return this.restoreInactiveUser(user.id, data);
    }

    const result = await this.userRepository.create(data);

    const newUser: UserResponse | null = await this.userRepository.findOne(result.username);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuario creado correctamente',
      data: { id: newUser.id, username: result.username },
    };
  }

  private async restoreInactiveUser(id: string, data: CreateUserDto) {
    await this.userRepository.restoreWithCredentials(id, data);
    if (data.role_ids?.length) {
      await this.rolesService.setRoles({ user_id: id, roles_id: data.role_ids });
    }
    const restored = await this.userRepository.findOne(id);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuario reactivado correctamente',
      data: { id: restored.id, username: restored.username },
    };
  }

  async update(unique: string, data: UpdateUserDto) {
    const where = isUUID(unique) ? { id: unique } : { username: unique };
    return this.userRepository.update(where, data);
  }

  async updateAuthUser(id: string, data: UpdateAuthUserDto) {
    const exists = await this.userRepository.findOne(id, true);
    if (!exists) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `El usuario con id ${id} no existe`,
      });
    }

    const { password, username, role_ids, person } = data;
    if (!password && !username && !role_ids && !person) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No se ha enviado ningún dato para actualizar',
      });
    }

    if (password) {
      const same = await bcrypt.compare(password, exists.password);
      if (!same) {
        await this.userRepository.update({ id }, { password, is_first_login: false });
      }
    }

    if (username) {
      const other = await this.userRepository.findOne(username);
      if (other && other.id !== id) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `El nombre de usuario ${username} ya existe`,
        });
      }
      await this.userRepository.update({ id }, { username });
      await this.userRepository.syncPersonEmail(id, username);
    }

    if (person) {
      await this.userRepository.upsertPerson(id, username ?? exists.username, person);
    }

    if (role_ids) {
      if (!role_ids.length) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Elige al menos un rol.',
        });
      }
      await this.assertNotLastAdminLoss(id, role_ids);
      await this.rolesService.setRoles({ user_id: id, roles_id: role_ids });
    }

    return this.userRepository.findOne(id);
  }

  private async assertNotLastAdminLoss(userId: string, incomingRoleIds?: string[]) {
    const admin = await this.rolesService.findOne('ADMIN');
    const user = await this.userRepository.findOne(userId);
    const hasAdmin = user?.user_role?.some((ur) => ur.role.name === 'ADMIN');
    const wouldLose = hasAdmin && (incomingRoleIds ? !incomingRoleIds.includes(admin.id) : true);
    if (!wouldLose) return;
    const n = await this.userRepository.countActiveAdmins();
    if (n <= 1) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No puedes dejar el sistema sin un administrador',
      });
    }
  }

  async getUserRoles(userId: string) {
    const user = await this.userRepository.findOne(userId);
    if (!user) return [];

    return user.user_role.map((userRole) => userRole.role);
  }

  async inactive(inactiveUserDto: InactiveUserDto, user: RequestUserDto) {
    if (inactiveUserDto.user_id === user.id) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No puedes darte de baja a ti mismo',
      });
    }
    await this.assertNotLastAdminLoss(inactiveUserDto.user_id);
    return this.userRepository.inactive(inactiveUserDto, user);
  }

  active(inactiveUserDto: InactiveUserDto) {
    return this.userRepository.active(inactiveUserDto);
  }

  async updateLockUntil(user_id: string, lock_until: Date) {
    return this.userRepository.updateLockUntil(user_id, lock_until);
  }

  findByIdsOrRole(query: FindByIdsOrRoleQueryDto): Promise<UserResponse[]> {
    return this.userRepository.findByIdsOrRole(query);
  }
}
