// First-run setup: creates .env.local with a random secret and the initial admin account.
// Usage: npm run setup -- --email you@example.com [--password ...]
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

const arg = (name) => { const index = process.argv.indexOf(`--${name}`); return index > -1 ? process.argv[index + 1] : undefined; };

if (!fs.existsSync('.env.local')) {
  const template = fs.readFileSync('.env.example', 'utf8');
  fs.writeFileSync('.env.local', template.replace('APP_SECRET=', `APP_SECRET=${crypto.randomBytes(32).toString('hex')}`), { mode: 0o600 });
  console.log('Created .env.local with a new APP_SECRET.');
}
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, '');
}

if (!process.env.DATABASE_URL) {
  console.error('\nAdd DATABASE_URL to .env.local (see .env.example), then run npm run setup again.\n');
  process.exit(1);
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('npx prisma generate', { stdio: 'inherit' });

const { closeDb, getDb } = await import('../lib/db.js');
const { seedBaseData } = await import('../lib/seed.js');
const { hashPassword } = await import('../lib/security.js');
const db = getDb();
await seedBaseData();

if (await db.user.findFirst({ where: { role: 'admin' } })) {
  console.log('An admin account already exists. Nothing else to do.');
} else {
  const email = arg('email') || 'admin@alzaujain.local';
  const password = arg('password') || crypto.randomBytes(9).toString('base64url');
  await db.user.create({ data: { email, password_hash: hashPassword(password), name: 'Administrator', role: 'admin' } });
  console.log(`\nAdmin account created.\n  Email:    ${email}\n  Password: ${password}\nThis password is shown once. Change it after signing in.\n`);
}
await closeDb();
