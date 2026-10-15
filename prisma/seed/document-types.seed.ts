import { DocumentTypes } from '@prisma/client';

export interface DocumentType {
  name: string;
  short_name: DocumentTypes;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  { name: 'Cédula de ciudadanía', short_name: DocumentTypes.NATIONAL_ID },
  { name: 'Tarjeta de identidad', short_name: DocumentTypes.IDENTITY_CARD },
  { name: 'Otro', short_name: DocumentTypes.OTHER },
];
