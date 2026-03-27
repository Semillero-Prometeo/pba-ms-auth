import 'dotenv/config';
import { DocumentTypes, Prisma, PrismaClient, Roles } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import * as bcrypt from 'bcrypt';
import { DOCUMENT_TYPES } from './seed/document-types.seed';
import { APP_SETTINGS_SEED } from './seed/app-settings.seed';

// Inicializa el adaptador
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Pásalo al cliente
const prisma = new PrismaClient({ adapter });

export async function createDocumentTypes() {
  await prisma.document_type.createMany({
    data: DOCUMENT_TYPES,
    skipDuplicates: true,
  });
}

export const createSeedRoles = async () => {
  const existingRoles = await prisma.role.findMany({
    where: { name: { in: Object.keys(Roles) as Roles[] } },
  });

  await prisma.role.createMany({
    data: Object.keys(Roles)
      .filter((role) => !existingRoles.some((r) => r.name === (role as Roles)))
      .map((role) => ({ name: role as Roles })),
  });
};

async function createSeedUser() {
  const username: string = 'admin-prometeo@unilibre.edu.co';

  const existingUser = await prisma.user.findFirst({
    where: { username },
  });

  if (existingUser) {
    console.info('Usuario semilla ya existe, saltando creación.');
    return existingUser;
  }

  // Obtener datos necesarios
  const [documentType, adminRole] = await Promise.all([
    prisma.document_type.findFirst({ where: { short_name: DocumentTypes.NATIONAL_ID } }),
    prisma.role.findFirst({ where: { name: Roles.ADMIN } }),
  ]);

  if (!documentType || !adminRole) {
    throw new Error('Faltan datos básicos para crear el usuario semilla');
  }

  // Crear la persona

  const data: Prisma.personCreateInput = {
    document_type: {
      connect: {
        id: documentType.id,
      },
    },
    first_name: 'Administrador',
    last_name: 'Prometeo',
    email: username,
    document_number: '123456789',
    phone: '3001234567',
  };

  const person = await prisma.person.create({
    data,
  });

  // Hashear la contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('Prometeo2026*', saltRounds);

  // Crear el usuario
  const user = await prisma.user.create({
    data: {
      person_id: person.id,
      username,
      password: hashedPassword,
      is_first_login: false,
      user_role: {
        create: {
          role: {
            connect: {
              id: adminRole.id,
            },
          },
        },
      },
    },
  });

  console.info('Usuario semilla creado exitosamente.');
  return user;
}

export async function createAppSettings() {
  const existingAppSettings = await prisma.app_settings.findMany({
    where: { key: { in: APP_SETTINGS_SEED.map((setting) => setting.key) } },
  });

  await prisma.app_settings.createMany({
    data: APP_SETTINGS_SEED.filter((setting) => !existingAppSettings.some((s) => s.key === setting.key)),
  });

  console.info('Configuraciones de aplicación creadas exitosamente.');
}

// 7. main
async function main() {
  await createDocumentTypes();
  await createSeedRoles();
  await createSeedUser();
  await createAppSettings();

  console.info('Datos insertados correctamente.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
