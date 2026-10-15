import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, Roles, user, person } from '@prisma/client';
import { isUUID } from 'class-validator';
import { CreateUserDto, CreateUserWithoutPersonDto, PersonInputDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordPayload } from 'src/auth/interfaces/payload';
import { InactiveUserDto } from '../dto/delete-user.dto';
import { ConfigType } from '@nestjs/config';
import configurations from 'src/core/settings/app.setting';
import { FindAllUsersQueryDto } from '../dto/find-all-user.dto';
import { PrismaService } from 'src/core/database/database.service';
import { RpcException } from '@nestjs/microservices';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RequestUserDto } from 'src/core/dto/request-user.dto';
import { PasswordGeneratorService } from 'src/auth/services/password-generator.service';
import { UserResponse } from '../interfaces/user';
import { PaginatedResponse } from 'src/core/interfaces/paginated';
import { PersonResponse } from 'src/person/interfaces/person';

@Injectable()
export class UsersRepository {
  private readonly logger: Logger = new Logger(UsersRepository.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordGeneratorService: PasswordGeneratorService,
  ) {}

  async findAll({ skip, take, search, roles }: FindAllUsersQueryDto): Promise<PaginatedResponse<UserResponse>> {
    const baseWhere: Prisma.userWhereInput = {
      deleted_at: null,
      ...(roles && {
        user_role: {
          some: {
            role: {
              id: { in: roles },
            },
          },
        },
      }),
    };

    const where: Prisma.userWhereInput = {
      ...baseWhere,
      ...(search && {
        OR: [
          { username: { contains: search } },
          { person: { first_name: { contains: search } } },
          { person: { last_name: { contains: search } } },
          { person: { email: { contains: search } } },
          { person: { document_number: { contains: search } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        select: {
          id: true,
          person_id: true,
          username: true,
          temp_password: true,
          failed_attempts: true,
          lock_until: true,
          is_first_login: true,
          deleted_reason: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          person: {
            include: {
              document_type: true,
            },
          },
          user_role: {
            select: {
              id: true,
              user_id: true,
              role_id: true,
              created_at: true,
              updated_at: true,
              role: true,
            },
          },
        },
        where,
        skip,
        take,
      }),
    ]);

    return { total, data };
  }

  async findOne(unique: string, includePassword = false): Promise<UserResponse | null> {
    const whereUnique: Prisma.userWhereInput = isUUID(unique) ? { id: unique } : { username: unique };
    const where = { ...whereUnique };

    const user: UserResponse | null = await this.prismaService.user.findFirst({
      where,
      select: {
        id: true,
        person_id: true,
        temp_password: true,
        deleted_reason: true,
        username: true,
        created_at: true,
        updated_at: true,
        person: {
          include: {
            document_type: true,
          },
        },
        password: includePassword,
        failed_attempts: true,
        lock_until: true,
        is_first_login: true,
        deleted_at: true,
        user_role: {
          select: {
            id: true,
            created_at: true,
            updated_at: true,
            role_id: true,
            user_id: true,
            role: true,
          },
        },
      },
    });

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { role_id, person_id, role_ids, password, person: personPayload } = createUserDto;
    const { isValid, errors } = this.passwordGeneratorService.validatePassword(createUserDto.password);

    if (!isValid) {
      throw new RpcException({
        message: errors.join(', '),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (!personPayload) {
      throw new RpcException({
        message: 'Los datos de la persona son obligatorios',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);

    try {
      const user = await this.prismaService.$transaction(async (tx) => {
        const person = person_id
          ? await tx.person.update({
              where: { id: person_id },
              data: { email: createUserDto.username },
            })
          : await tx.person.create({
              data: {
                first_name: personPayload.first_name,
                last_name: personPayload.last_name,
                email: createUserDto.username,
                document_number: personPayload.document_number,
                phone: personPayload.phone,
                document_type: { connect: { id: personPayload.document_type_id } },
              },
            });

        const created = await tx.user.create({
          data: {
            username: createUserDto.username,
            password: hashedPassword,
            person: { connect: { id: person.id } },
          },
        });

        const ids = [...(role_ids ?? []), ...(role_id ? [role_id] : [])];
        for (const rid of ids) {
          await tx.user_role.create({ data: { user_id: created.id, role_id: rid } });
        }
        return created;
      });

      const resetToken = this.passwordGeneratorService.generatePasswordResetToken(user.id);
      return { id: user.id, username: user.username, resetToken };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          const target = (e.meta?.target as string[] | undefined) ?? [];
          const message = target.some((t) => t.includes('email') || t.includes('username'))
            ? 'El usuario ya existe'
            : 'Ya existe una persona registrada con este número y tipo de documento';
          throw new RpcException({ message, statusCode: HttpStatus.BAD_REQUEST });
        }
        if (e.code === 'P2025') {
          throw new RpcException({
            message: 'El tipo de documento no existe',
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
      }
      throw e;
    }
  }

  async update(where: Prisma.userWhereUniqueInput, updateUserDto: UpdateUserDto) {
    const data: Prisma.userUpdateInput = { ...updateUserDto };

    // Obtener el usuario antes de actualizarlo para comparar cambios
    const currentUser = await this.prismaService.user.findUnique({
      where,
      include: {
        person: true,
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      throw new RpcException({
        message: 'Usuario no encontrado',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    let changesMessage = 'Se han realizado los siguientes cambios en su perfil:';
    let hasImportantChanges = false;

    if (updateUserDto.username && updateUserDto.username !== currentUser.username) {
      changesMessage += `\n- Su correo electrónico ha sido actualizado de ${currentUser.username} a ${updateUserDto.username}.`;
      hasImportantChanges = true;

      // Actualizar el email en la tabla persona
      await this.prismaService.person.update({
        data: { email: updateUserDto.username },
        where: { id: updateUserDto.person_id || currentUser.person.id },
      });
    }

    // Verificar cambio de contraseña
    if (updateUserDto.password) {
      changesMessage += '\n- Su contraseña ha sido actualizada.';
      hasImportantChanges = true;

      // Hash de la nueva contraseña
      const hashedPassword = bcrypt.hashSync(updateUserDto.password, 10);
      data.password = hashedPassword;
    }

    // Actualizar el usuario
    const updatedUser = await this.prismaService.user.update({
      where,
      data,
      include: {
        person: true,
      },
    });

    return {
      updatedUser,
      notificationInfo: hasImportantChanges
        ? {
            hasImportantChanges,
            changesMessage,
          }
        : null,
    };
  }

  async inactive({ user_id: id, reason }: InactiveUserDto, user: RequestUserDto) {
    const deleted_reason = `${user.id}: ${reason}`;
    const deleted_at = new Date();

    return this.prismaService.user.update({
      where: { id },
      data: { deleted_at, deleted_reason },
      select: {
        id: true,
        username: true,
        created_at: true,
        updated_at: true,
        person: true,
        failed_attempts: true,
        lock_until: true,
        is_first_login: true,
        deleted_at: true,
        user_role: {
          select: {
            role: true,
          },
        },
      },
    });
  }

  active({ user_id: id }: InactiveUserDto) {
    return this.prismaService.user.update({
      where: { id },
      data: { deleted_at: null, deleted_reason: null, failed_attempts: 0, lock_until: null },
      select: {
        id: true,
        username: true,
        created_at: true,
        updated_at: true,
        person: true,
        failed_attempts: true,
        lock_until: true,
        is_first_login: true,
        deleted_at: true,
        user_role: {
          select: {
            role: true,
          },
        },
      },
    });
  }

  async assingPerson(user_id: string, person_id: string) {
    await this.prismaService.user.updateMany({
      where: {
        person_id,
      },
      data: {
        person_id: null,
      },
    });

    return this.prismaService.user.update({
      where: { id: user_id },
      data: { person_id },
    });
  }

  countActiveAdmins() {
    return this.prismaService.user.count({
      where: {
        deleted_at: null,
        user_role: { some: { role: { name: 'ADMIN' } } },
      },
    });
  }

  async upsertPerson(userId: string, username: string, person: PersonInputDto) {
    const existing = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { person_id: true },
    });
    if (existing?.person_id) {
      return this.prismaService.person.update({
        where: { id: existing.person_id },
        data: {
          first_name: person.first_name,
          last_name: person.last_name,
          email: username,
          document_number: person.document_number,
          phone: person.phone ?? null,
          document_type_id: person.document_type_id,
        },
      });
    }
    const created = await this.prismaService.person.create({
      data: {
        first_name: person.first_name,
        last_name: person.last_name,
        email: username,
        document_number: person.document_number,
        phone: person.phone,
        document_type: { connect: { id: person.document_type_id } },
      },
    });
    return this.prismaService.user.update({
      where: { id: userId },
      data: { person: { connect: { id: created.id } } },
    });
  }

  async syncPersonEmail(userId: string, email: string) {
    const existing = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { person_id: true },
    });
    if (!existing?.person_id) return;
    return this.prismaService.person.update({
      where: { id: existing.person_id },
      data: { email },
    });
  }

  async updateLockUntil(user_id: string, lock_until: Date) {
    return this.prismaService.user.update({
      where: { id: user_id },
      data: { lock_until },
    });
  }

  findByIdsOrRole({ ids, roleName }: { ids?: string[]; roleName?: Roles }): Promise<UserResponse[]> {
    const where: Prisma.userWhereInput = {
      ...(ids && { id: { in: ids } }),
      ...(roleName && { user_role: { some: { role: { name: roleName } } } }),
    };

    return this.prismaService.user.findMany({
      where,
      include: {
        person: {
          include: {
            document_type: true,
          },
        },
        user_role: { include: { role: true } },
      },
    });
  }
}
