import { DocumentTypes } from '@prisma/client';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });

export interface DocumentType {
  name: string;
  short_name: DocumentTypes;
}

export const DOCUMENT_TYPES = [
  { name: 'Identificacion Nacional', short_name: DocumentTypes.NATIONAL_ID },
  { name: 'Identificacion Extranjera', short_name: DocumentTypes.FOREIGNER_ID },
  { name: 'Pasaporte', short_name: DocumentTypes.PASSPORT },
  { name: 'Permiso de Residencia', short_name: DocumentTypes.RESIDENCY_PERMISSION },
  { name: 'Otro', short_name: DocumentTypes.OTHER },
];
