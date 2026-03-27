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
import { app_settings, AppSettings, role, Roles } from '@prisma/client';
import { RolesService } from 'src/roles/roles.service';
import { AppSettingsService } from 'src/app-settings/app-settings.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    @Inject(forwardRef(() => RolesService)) private readonly rolesService: RolesService,
    private readonly appSettingsService: AppSettingsService,
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

    if (user) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El usuario ya existe',
      });
    }

    const assignStudentRole = data.assign_student_role !== false;
    const studentRole: role | null = assignStudentRole ? await this.rolesService.findOne(Roles.STUDENT) : null;

    const result = await this.userRepository.create({ ...data, role_id: studentRole?.id ?? undefined });

    const newUser: UserResponse | null = await this.userRepository.findOne(result.username);

    const [frontendUrl]: [app_settings] = await Promise.all([
      this.appSettingsService.findOne(AppSettings.FRONT_END_URL),
    ]);

    if (!frontendUrl) {
      throw new RpcException({
        message: 'No se encontró la URL de frontend',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuario creado correctamente',
      data: { id: newUser.id, username: result.username },
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

    const { password, username } = data;
    let changesMessage = 'Se han realizado los siguientes cambios en su perfil:';
    let hasImportantChanges = false;

    if (password) {
      const isOldPassword = await bcrypt.compare(password, exists.password);
      if (isOldPassword) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Esta contraseña ya ha sido utilizada anteriormente, por favor elige una nueva',
        });
      }

      changesMessage += '\n- Su contraseña ha sido actualizada.';
      hasImportantChanges = true;

      const updateData: UpdateUserDto = { password, is_first_login: true };
      const result = await this.userRepository.update({ id }, updateData);

      return result.updatedUser;
    }

    if (username) {
      // Validar si el nuevo username ya existe
      const user = await this.userRepository.findOne(username);
      if (user && user.id !== id) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `El nombre de usuario ${username || 'N/A'} ya existe`,
        });
      }

      changesMessage += `\n- Su correo electrónico ha sido actualizado de ${exists.username} a ${username}.`;
      hasImportantChanges = true;

      const result = await this.userRepository.update({ id }, { username, person_id: exists.person.id });

      return result.updatedUser;
    }

    throw new RpcException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'No se ha enviado ningún dato para actualizar',
    });
  }

  async getUserRoles(userId: string) {
    const user = await this.userRepository.findOne(userId);
    if (!user) return [];

    return user.user_role.map((userRole) => userRole.role);
  }

  async inactive(inactiveUserDto: InactiveUserDto, user: RequestUserDto) {
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
