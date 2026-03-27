import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';
import type { PrismaConfig } from 'prisma';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node -r tsconfig-paths/register ./prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
}) as PrismaConfig;
