import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mariadb from 'mariadb';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

// Tests always use a separate database whose name ends in _test, recreated on every run.
export function testDatabaseUrl() {
  const source = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!source) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL in .env.local');
  const url = new URL(source);
  if (!url.pathname.endsWith('_test')) url.pathname += '_test';
  return url.toString();
}

export async function prepareTestDatabase() {
  const url = new URL(testDatabaseUrl());
  const name = url.pathname.slice(1);
  if (!/^\w+_test$/.test(name)) throw new Error(`Refusing to reset "${name}"`);
  const connection = await mariadb.createConnection({ host: url.hostname, port: Number(url.port) || 3306, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) });
  await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();
  process.env.DATABASE_URL = url.toString();
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
  const { seedBaseData } = await import('../lib/seed.js');
  await seedBaseData();
  return url.toString();
}

export function useTempStorage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-test-'));
  process.env.STORAGE_DIR = dir;
  process.env.APP_SECRET = 'test-secret-test-secret-test-secret-test';
  return dir;
}

export const sampleProfile = (overrides = {}) => ({
  full_name: 'Test Person', gender: 'female', date_of_birth: `${new Date().getFullYear() - 27}-01-01`, height_cm: 165, marital_status: 'Never married',
  mother_tongue: 'Urdu', caste: 'Jutt', nationality: 'Pakistani', origin_country: 'Pakistan', origin_city: 'Multan', profile_created_by: 'Self',
  education_level: 'Masters', degree: 'MSc', occupation: 'Teacher', employment_status: 'Employed', religion: 'Islam', sect: 'Sunni',
  country_id: 1, city: 'Multan', description: 'A kind person.', partner_demand: 'An educated partner.', contact_phone: '0300 1234567', contact_email: 'person@example.com', ...overrides,
});
