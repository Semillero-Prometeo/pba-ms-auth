import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, Roles, user, person } from '@prisma/client';
import { isUUID } from 'class-validator';
import { CreateUserDto, CreateUserWithoutPersonDto } from '../dto/create-user.dto';
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
      ...(roles && {
        user_role: {
          some: {
            role: {
              id: { in: roles },
            },
          },
        },
      }),
      person_id: { not: null },
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
    const { role_id, assign_student_role, person_id, ...data } = createUserDto;
    const password = this.passwordGeneratorService.generateTemporaryPassword();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const { isValid, errors } = this.passwordGeneratorService.validatePassword(hashedPassword);

    if (!isValid) {
      throw new RpcException({
        message: errors.join(', '),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (createUserDto.person_id) {
      const person = await this.prismaService.person.findUnique({
        where: { id: createUserDto.person_id, deleted_at: null },
      });

      if (!person) {
        throw new RpcException({
          message: 'La persona no existe o no se encuentra activa, por favor verifique',
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      await this.prismaService.person.update({
        where: { id: person.id },
        data: { email: createUserDto.username },
      });
    }

    const user = await this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
        ...(person_id
          ? {
              person: {
                connect: { id: person_id },
              },
            }
          : {}),
      },
    });

    if (role_id) {
      await this.prismaService.user_role.create({
        data: { user_id: user.id, role_id },
      });
    }

    const resetToken = this.passwordGeneratorService.generatePasswordResetToken(user.id);

    return { id: user.id, username: user.username, resetToken };
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
