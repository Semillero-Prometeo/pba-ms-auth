import { Injectable } from '@nestjs/common';
import { document_type, DocumentTypes, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from 'src/core/database/database.service';

@Injectable()
export class DocumentTypesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(unique: string): Promise<document_type> {
    const where: Prisma.document_typeWhereUniqueInput = isUUID(unique)
      ? { id: unique }
      : { short_name: unique as DocumentTypes };

    return this.prismaService.document_type.findUnique({ where });
  }

  async findAll(): Promise<document_type[]> {
    return this.prismaService.document_type.findMany();
  }
}
