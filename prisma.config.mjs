import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '', shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL },
});
