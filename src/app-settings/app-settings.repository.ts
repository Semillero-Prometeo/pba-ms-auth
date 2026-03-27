import { Injectable } from '@nestjs/common';
import { app_settings, AppSettings, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from 'src/core/database/database.service';

@Injectable()
export class AppSettingsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(key: AppSettings) {
    return this.prismaService.app_settings.findFirst({ where: { key, deleted_at: null } });
  }

  async getSetting(unique: AppSettings, startAt?: Date, endAt?: Date): Promise<app_settings | null> {
    const defaultWhere: Prisma.app_settingsWhereInput = isUUID(unique) ? { id: unique } : { key: unique };

    if (startAt) defaultWhere.start_at = { gte: startAt };
    if (endAt) defaultWhere.deleted_at = { lte: endAt };

    return this.prismaService.app_settings.findFirst({ where: { ...defaultWhere, deleted_at: null } });
  }

  async getSettings(unique: AppSettings, deleted?: boolean): Promise<app_settings[]> {
    const defaultWhere: Prisma.app_settingsWhereInput = isUUID(unique) ? { id: unique } : { key: unique };

    const deletedClause = deleted ? {} : { deleted_at: null };

    return this.prismaService.app_settings.findMany({ where: { ...defaultWhere, ...deletedClause } });
  }

  findAll() {
    return this.prismaService.app_settings.findMany({ where: { deleted_at: null } });
  }

  async update(key: AppSettings, value: string, startAt?: Date) {
    return this.prismaService.$transaction(async (tx) => {
      const now = new Date();

      // Set end_at to null for all settings with the same key
      await tx.app_settings.updateMany({
        where: { key, deleted_at: null },
        data: { deleted_at: startAt || now },
      });

      // Create a new setting with the new value
      await tx.app_settings.create({
        data: { key, value, start_at: startAt || now },
      });
    });
  }
}
