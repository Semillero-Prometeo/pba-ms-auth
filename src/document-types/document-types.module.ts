import { Module } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesRepository } from './repositories/document-types.repository';
import { PrismaModule } from 'src/core/database/database.module';
import { DocumentTypesController } from './document-types.controller';

@Module({
  imports: [PrismaModule],
  providers: [DocumentTypesService, DocumentTypesRepository],
  controllers: [DocumentTypesController],
  exports: [DocumentTypesService],
})
export class DocumentTypesModule {}
