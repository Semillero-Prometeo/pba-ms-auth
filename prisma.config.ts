import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';
import type { PrismaConfig } from 'prisma';

export default defineConfig({
  schema: 'src/core/database/schema/schema.prisma',
  migrations: {
    path: 'src/core/database/schema/migrations',
    seed: 'ts-node -r tsconfig-paths/register ./src/core/database/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
}) as PrismaConfig;
