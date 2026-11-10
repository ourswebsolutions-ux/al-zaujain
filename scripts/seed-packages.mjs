// Creates the standard rishta packages (the reference site's set and prices): seven Local packages,
// the International (Foreign) package, Boost and Super Boost. Safe to run more than once: a package
// whose name already exists is left exactly as it is, so prices edited in the admin panel are kept.
//   npm run seed:packages
import fs from 'node:fs';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const { closeDb, getDb } = await import('../lib/db.js');
const db = getDb();

const PACKAGES = [
  // name, kind, scope, profile connects, price, price before discount, boost days, super boost
  ['Bronze', 'credits', 'local', 30, 1500, 3000],
  ['Silver', 'credits', 'local', 60, 2500, 5000],
  ['Gold', 'credits', 'local', 120, 4500, 9000],
  ['Diamond', 'credits', 'local', 200, 6500, 13000],
  ['Platinum', 'credits', 'local', 250, 8500, 17000],
  ['VIP', 'credits', 'local', 300, 10000, 20000],
  ['Elite', 'credits', 'local', 400, 12500, 25000],
  ['Foreign', 'credits', 'foreign', 500, 15000, 30000],
  ['Boost', 'boost', 'local', 0, 2000, null, 15, false],
  ['Super Boost', 'boost', 'local', 0, 3000, null, 30, true],
];

let created = 0;
for (const [index, [name, kind, scope, credits, price, was, days = null, superBoost = false]] of PACKAGES.entries()) {
  if (await db.creditPackage.findFirst({ where: { name } })) {
    console.log(`kept     ${name} (already exists)`);
    continue;
  }
  await db.creditPackage.create({ data: { name, kind, scope, credits, price, was_price: was, days, super_boost: superBoost, sort: (index + 1) * 10, active: true } });
  created += 1;
  console.log(`created  ${name}`);
}
console.log(`${created} package${created === 1 ? '' : 's'} created.`);
await closeDb();
