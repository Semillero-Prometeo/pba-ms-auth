import { Global, Module } from '@nestjs/common';

import { PrismaService } from './database.service';

@Global()
@Module({
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
