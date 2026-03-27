import { Injectable, Logger } from '@nestjs/common';
import { DocumentTypesRepository } from './repositories/document-types.repository';
import { document_type } from '@prisma/client';

@Injectable()
export class DocumentTypesService {
  private readonly logger = new Logger(DocumentTypesService.name);

  constructor(private readonly documentTypesRepository: DocumentTypesRepository) {}

  async findOne(unique: string): Promise<document_type | null> {
    return this.documentTypesRepository.findOne(unique);
  }

  async findAll(): Promise<document_type[]> {
    return this.documentTypesRepository.findAll();
  }
}
