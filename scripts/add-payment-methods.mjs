// Adds the bureau's official payment accounts (MCB Bank and JazzCash) with their QR codes.
// Safe to run more than once: an account whose name already exists is left as it is.
//   npm run seed:payments
import fs from 'node:fs';
import path from 'node:path';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const { closeDb, getDb } = await import('../lib/db.js');
const { savePaymentImage } = await import('../lib/uploads.js');
const db = getDb();

const METHODS = [
  {
    name: 'MCB Bank',
    bank_name: 'MCB Bank Limited',
    account_holder: 'Muhammad Asif Bashir',
    account_number: '1470844381009953',
    iban: 'PK15MUCB1470844381009953',
    instructions: 'Scan the QR code or transfer to this account, then send the payment screenshot on our official WhatsApp.',
    qr: 'mcb.png',
    sort: 10,
  },
  {
    name: 'JazzCash',
    bank_name: 'JazzCash (Mobile Wallet)',
    account_holder: 'Muhammad Asif Bashir',
    account_number: '03208686360',
    iban: null,
    instructions: 'Scan the QR code in your JazzCash app or send to this JazzCash number, then send the payment screenshot on our official WhatsApp.',
    qr: 'jazzcash.png',
    sort: 20,
  },
];

for (const { qr, ...method } of METHODS) {
  if (await db.paymentMethod.findFirst({ where: { name: method.name } })) {
    console.log(`kept     ${method.name} (already exists)`);
    continue;
  }
  const bytes = fs.readFileSync(path.join('scripts', 'payment-qr', qr));
  const qrImage = await savePaymentImage(new File([bytes], qr, { type: 'image/png' }));
  await db.paymentMethod.create({ data: { ...method, qr_image: qrImage, active: true } });
  console.log(`created  ${method.name}`);
}
await closeDb();
