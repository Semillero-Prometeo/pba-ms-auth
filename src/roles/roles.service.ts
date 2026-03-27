import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { role } from '@prisma/client';
import { RolesRepository } from './repositories/roles.repository';
import { FindAllQueryDto } from 'src/core/dto/find-all-query.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { UsersService } from 'src/users/users.service';
import { RpcException } from '@nestjs/microservices';
import { RequestUserDto } from 'src/core/dto/request-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
  ) {}

  async findOne(unique: string): Promise<role> {
    const role: role | null = await this.rolesRepository.findOne(unique);

    if (!role) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Rol no encontrado',
      });
    }

    return role;
  }

  findAll(query: FindAllQueryDto) {
    return this.rolesRepository.findAll(query);
  }

  async setRoles(setRolesDto: SetRoleDto) {
    const user = await this.usersService.findOne(setRolesDto.user_id);
    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Usuario no encontrado',
      });
    }
    return this.rolesRepository.setRoles(setRolesDto);
  }

  createRole(createRoleDto: CreateRoleDto) {
    return this.rolesRepository.createRole(createRoleDto);
  }

  deleteRole(id: string) {
    return this.rolesRepository.deleteRole(id);
  }
}
