import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, role, Roles } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from 'src/core/database/database.service';
import { FindAllQueryDto } from 'src/core/dto/find-all-query.dto';
import { SetRoleDto } from '../dto/set-role.dto';
import { RpcException } from '@nestjs/microservices';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class RolesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createRole(data: CreateRoleDto) {
    const { name } = data;
    const role = await this.prismaService.role.findUnique({
      where: { name },
    });

    if (role) {
      if (role.deleted_at) {
        return this.prismaService.$transaction(async (tx) => {
          const updatedRole = await tx.role.update({
            where: { id: role.id },
            data: {
              deleted_at: null,
            },
          });

          return updatedRole;
        });
      } else {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El rol ya existe',
        });
      }
    }

    return this.prismaService.role.create({ data: { name: name as Roles } });
  }

  async findAll(query: FindAllQueryDto) {
    const { skip, take, search } = query;

    const whereClause: Prisma.roleWhereInput = {
      deleted_at: null,
      ...(search && {
        name: { in: Object.values(Roles).filter((r) => r.toLowerCase().includes(search.toLowerCase())) },
      }),
    };

    const [data, total] = await Promise.all([
      this.prismaService.role.findMany({ where: whereClause, skip, take }),
      this.prismaService.role.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  findOne(unique: string): Promise<role | null> {
    const whereUnique: Prisma.roleWhereUniqueInput = isUUID(unique) ? { id: unique } : { name: unique as Roles };
    return this.prismaService.role.findUnique({
      where: whereUnique,
    });
  }

  async setRoles(setRolesDto: SetRoleDto) {
    const { rolesId, userId: user_id } = setRolesDto;

    const existingRoles = await this.prismaService.user_role.findMany({
      where: { user_id },
      select: { role_id: true },
    });

    const existingRoleIds = new Set(existingRoles.map((ur) => ur.role_id));
    const incomingRoleIds = new Set(rolesId);

    const toDelete = [...existingRoleIds].filter((id) => !incomingRoleIds.has(id));
    const toCreate = [...incomingRoleIds].filter((id) => !existingRoleIds.has(id));

    return this.prismaService.$transaction([
      this.prismaService.user_role.deleteMany({
        where: { user_id, role_id: { in: toDelete } },
      }),
      this.prismaService.user_role.createMany({
        data: toCreate.map((role_id) => ({ user_id, role_id })),
      }),
    ]);
  }

  deleteRole(id: string) {
    return this.prismaService.role.update({ where: { id }, data: { deleted_at: new Date() } });
  }
}
