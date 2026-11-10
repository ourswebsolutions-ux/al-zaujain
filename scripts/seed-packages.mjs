// Creates the standard rishta packages (the reference site's set and prices): seven Local packages,
// the International (Foreign) package, Boost and Super Boost. Safe to run more than once: a package
// whose name already exists is left exactly as it is, so prices edited in the admin panel are kept.
//   npm run seed:packages
import fs from 'node:fs';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const { closeDb, getDb } = await import('../lib/db.js');
const db = getDb();

const PACKAGES = [
  // name, kind, scope, profile connects, price, price before discount, card colour, boost days, super boost
  ['Bronze', 'credits', 'local', 30, 1500, 3000, '#b08d57'],
  ['Silver', 'credits', 'local', 60, 2500, 5000, '#a9a9a9'],
  ['Gold', 'credits', 'local', 120, 4500, 9000, '#e0b400'],
  ['Diamond', 'credits', 'local', 200, 6500, 13000, '#4fb8d0'],
  ['Platinum', 'credits', 'local', 250, 8500, 17000, '#747068'],
  ['VIP', 'credits', 'local', 300, 10000, 20000, '#ca3b11'],
  ['Elite', 'credits', 'local', 400, 12500, 25000, '#597696'],
  ['Foreign', 'credits', 'foreign', 500, 15000, 30000, '#f09400'],
  ['Boost', 'boost', 'local', 0, 2000, null, '#26a6a6', 15, false],
  ['Super Boost', 'boost', 'local', 0, 3000, null, '#4fb8d0', 30, true],
];

let created = 0;
for (const [index, [name, kind, scope, credits, price, was, color, days = null, superBoost = false]] of PACKAGES.entries()) {
  const existing = await db.creditPackage.findFirst({ where: { name } });
  if (existing) {
    // Only a missing card colour is filled in; everything else stays as the administrator set it.
    if (!existing.color) await db.creditPackage.update({ where: { id: existing.id }, data: { color } });
    console.log(`kept     ${name} (already exists${existing.color ? '' : ', colour added'})`);
    continue;
  }
  await db.creditPackage.create({ data: { name, kind, scope, credits, price, was_price: was, color, days, super_boost: superBoost, sort: (index + 1) * 10, active: true } });
  created += 1;
  console.log(`created  ${name}`);
}
console.log(`${created} package${created === 1 ? '' : 's'} created.`);
await closeDb();
