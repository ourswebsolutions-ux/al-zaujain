import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

function connectionFromUrl(value) {
  if (!value) throw new Error('DATABASE_URL is not set. Add your MySQL / MariaDB connection to .env.local.');
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: Number(process.env.DATABASE_POOL_SIZE) || 10,
    charset: 'utf8mb4',
  };
}

// Next.js can load this module more than once, so one client lives on globalThis.
export function getDb() {
  globalThis.__azPrisma ??= new PrismaClient({ adapter: new PrismaMariaDb(connectionFromUrl(process.env.DATABASE_URL)) });
  return globalThis.__azPrisma;
}

export async function closeDb() {
  await globalThis.__azPrisma?.$disconnect();
  globalThis.__azPrisma = undefined;
}
