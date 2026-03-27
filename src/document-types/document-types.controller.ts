import { Controller } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentType } from './interfaces/document-types';
import { document_type } from '@prisma/client';

@Controller()
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @MessagePattern(`${AUTH_MS}.documentTypesService.findAll`)
  findAll(): Promise<document_type[]> {
    return this.documentTypesService.findAll();
  }

  @MessagePattern(`${AUTH_MS}.documentTypesService.findOne`)
  findOne(@Payload() payload: { id: string }): Promise<DocumentType | null> {
    return this.documentTypesService.findOne(payload.id);
  }
}
