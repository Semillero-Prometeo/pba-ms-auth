import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import configurations from '../settings/app.setting';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @Inject(configurations.KEY)
    private readonly configService: ConfigType<typeof configurations>,
  ) {
    super({ adapter: new PrismaPg({ connectionString: configService.databaseUrl }) });
  }

  async onModuleInit() {
    this.logger.log('[INFO] Conectando a la base de datos');
    await this.$connect();
  }

  async onModuleDestroy() {
    this.logger.log('[INFO] Desconectando a la base de datos');
    await this.$disconnect();
  }
}
