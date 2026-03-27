import { HttpStatus, Injectable } from '@nestjs/common';
import { session } from '@prisma/client';
import { PrismaService } from 'src/core/database/database.service';
import { CreateSessionDto } from '../dto/session.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOneByUserId(user_id: string): Promise<session | null> {
    return this.prismaService.session.findFirst({
      where: { user_id, deleted_at: null },
    });
  }

  async create(createSessionDto: CreateSessionDto) {
    const { user_id, token, expires_at } = createSessionDto;

    await this.prismaService.session.updateMany({
      where: {
        user_id,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return this.prismaService.session.create({
      data: {
        user_id,
        token,
        expires_at,
      },
    });
  }

  async updateSession(user_id: string, token: string, expires_at: Date): Promise<session> {
    const session = await this.prismaService.session.findFirst({
      where: { user_id, deleted_at: null },
    });

    if (!session) {
      throw new RpcException({
        message: 'Sesión no encontrada',
        statusCode: HttpStatus.BAD_GATEWAY,
      });
    }

    return this.prismaService.session.update({
      where: { id: session.id },
      data: {
        token,
        expires_at,
      },
    });
  }
}
