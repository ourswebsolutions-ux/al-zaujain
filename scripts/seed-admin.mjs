// Creates an administrator, or resets an existing one's password.
// Usage: npm run seed:admin -- --email you@example.com [--name "Your Name"] [--password "..."]
// A password is generated when none is given. Prefer leaving it out, so it stays out of your shell history.
import crypto from 'node:crypto';
import fs from 'node:fs';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const arg = (name) => { const index = process.argv.indexOf(`--${name}`); return index > -1 ? process.argv[index + 1] : undefined; };

const email = (arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Give an email address: npm run seed:admin -- --email you@example.com');
  process.exit(1);
}
const password = arg('password') || process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
if (password.length < 8) {
  console.error('The password must be at least 8 characters.');
  process.exit(1);
}

const { closeDb, getDb } = await import('../lib/db.js');
const { seedBaseData } = await import('../lib/seed.js');
const { hashPassword } = await import('../lib/security.js');

const db = getDb();
await seedBaseData();
const existing = await db.user.findUnique({ where: { email } });
const data = { password_hash: hashPassword(password), role: 'admin', status: 'active', name: arg('name') || existing?.name || 'Administrator' };
await db.user.upsert({ where: { email }, create: { email, ...data }, update: data });
await db.session.deleteMany({ where: { user: { email } } });
console.log(`\nAdministrator ${existing ? 'updated' : 'created'}.\n  Email:    ${email}\n  Password: ${password}\nThis password is shown once. Change it after signing in.\n`);
await closeDb();
