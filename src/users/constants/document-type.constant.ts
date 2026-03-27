import { DocumentTypes } from '@prisma/client';
import { ExternalDocumentType } from 'src/document-types/enum/external-document-type.enum';

export const HOMOLOGATE_DOCUMENT_TYPE: Record<ExternalDocumentType, DocumentTypes> = {
  [ExternalDocumentType.NACIONAL]: DocumentTypes.NATIONAL_ID,
  [ExternalDocumentType.EXTRANJERO]: DocumentTypes.FOREIGNER_ID,
  [ExternalDocumentType.PASAPORTE]: DocumentTypes.PASSPORT,
  [ExternalDocumentType.RESIDENCIA]: DocumentTypes.RESIDENCY_PERMISSION,
  [ExternalDocumentType.OTRO]: DocumentTypes.OTHER,
};
