// End-to-end test: production build, isolated database, real browser, local SMTP receiver.
// Run with: npm run build && npm run test:e2e
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { prepareTestDatabase, sampleProfile } from '../helpers.mjs';

const PORT = 3211;
const BASE = `http://localhost:${PORT}`;
const SMTP_PORT = 2599;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-e2e-'));
const DATABASE_URL = await prepareTestDatabase();
const env = {
  ...process.env, DATABASE_URL, STORAGE_DIR: dir, APP_SECRET: crypto.randomBytes(32).toString('hex'),
  SITE_URL: BASE, CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(SMTP_PORT), SMTP_SECURE: 'false', SMTP_USER: '', SMTP_PASS: '', SMTP_FROM: 'Al Zaujain <no-reply@test.local>',
};
Object.assign(process.env, env);

const emails = [];
const smtp = net.createServer((socket) => {
  let inData = false; let buffer = '';
  socket.write('220 test\r\n');
  socket.on('data', (chunk) => {
    buffer += chunk.toString('latin1');
    if (inData) {
      if (buffer.endsWith('\r\n.\r\n')) { emails.push(buffer); buffer = ''; inData = false; socket.write('250 ok\r\n'); }
      return;
    }
    for (const line of buffer.split('\r\n').slice(0, -1)) {
      if (/^EHLO|^HELO/i.test(line)) socket.write('250 test\r\n');
      else if (/^DATA/i.test(line)) { inData = true; socket.write('354 go\r\n'); }
      else if (/^QUIT/i.test(line)) { socket.write('221 bye\r\n'); socket.end(); }
      else socket.write('250 ok\r\n');
    }
    buffer = buffer.slice(buffer.lastIndexOf('\r\n') + 2);
  });
  socket.on('error', () => {});
});
await new Promise((resolve) => { smtp.listen(SMTP_PORT, '127.0.0.1', resolve); });

const decoded = (raw) => raw.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
const lastEmailTo = (address) => decoded([...emails].reverse().find((mail) => mail.includes(`To: ${address}`)) ?? '');
const linkIn = (mail, part) => new RegExp(`${BASE}${part}[^\\s"<)]*`).exec(mail)?.[0];

const { closeDb, getDb } = await import('../../lib/db.js');
const { hashPassword } = await import('../../lib/security.js');
const { createProfile } = await import('../../lib/profiles.js');
const { profileCode } = await import('../../lib/format.js');
const db = getDb();
const ADMIN = { email: 'admin@test.local', password: 'Admin-pass-123' };
await db.user.create({ data: { email: ADMIN.email, password_hash: hashPassword(ADMIN.password), name: 'Admin', role: 'admin' } });

const server = spawn('npx', ['next', 'start', '-p', String(PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let serverLog = '';
server.stdout.on('data', (data) => { serverLog += data; });
server.stderr.on('data', (data) => { serverLog += data; });
for (let attempt = 0; attempt < 60; attempt += 1) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* still starting */ }
  await new Promise((resolve) => { setTimeout(resolve, 500); });
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium' });
const results = [];
const problems = [];

async function step(name, run) {
  try {
    await run();
    results.push(`  ok  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${String(error.message).split('\n').slice(0, 6).join('\n      ')}`);
  }
  console.log(results.at(-1));
}

async function newPage(extra = {}) {
  const { welcome, ...options } = extra;
  const context = await browser.newContext({ baseURL: BASE, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce', ...options });
  // A returning visitor: the WhatsApp Channel welcome was already answered. The welcome step opts in.
  if (!welcome) await context.addInitScript(() => localStorage.setItem('az_channel_welcome', JSON.stringify({ choice: 'joined', at: Date.now() })));
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', (error) => problems.push(`${page.url()}: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error' && !/404|401|403|409|422|429/.test(message.text())) problems.push(`${page.url()}: ${message.text().slice(0, 200)}`); });
  return page;
}

async function signIn(page, email, password, url = '/login') {
  await page.goto(url);
  await page.fill('input[name=email]', email);
  await page.fill('input[name=password]', password);
  await page.click('button[type=submit]');
}

const fixtures = path.join(dir, 'fixtures');
fs.mkdirSync(fixtures);
const photoPath = path.join(fixtures, 'photo.jpg');
const cnicPath = path.join(fixtures, 'cnic.jpg');
const fakePath = path.join(fixtures, 'fake.jpg');
await sharp({ create: { width: 800, height: 800, channels: 3, background: '#a05030' } }).jpeg().toFile(photoPath);
await sharp({ create: { width: 900, height: 560, channels: 3, background: '#30a050' } }).jpeg().toFile(cnicPath);
fs.writeFileSync(fakePath, 'this is not an image');

const year = new Date().getFullYear();
// Searchable lists keep their value in a hidden input: type into the visible box, then leave it.
async function typeInto(box, text) {
  await box.fill(text);
  await box.press('Tab');
}
const pick = (scope, label, text) => typeInto(scope.locator(`label:has-text("${label}") [role=combobox]`).first(), text);

async function fillWizard(page, data) {
  const set = async (name, value) => {
    const control = page.locator(`form [name="${name}"], main [name="${name}"]`).first();
    const kind = await control.evaluate((node) => (node.type === 'hidden' ? 'search' : node.tagName));
    if (kind === 'SELECT') await control.selectOption(value);
    else if (kind === 'search') await typeInto(page.locator(`#${name}`), value);
    else await control.fill(value);
  };
  const next = () => page.click('button:has-text("Continue")');
  for (const [name, value] of Object.entries(data.personal)) await set(name, value);
  await set('description', data.description); await set('contact_phone', data.phone); await set('contact_email', data.email);
  await next();
  await page.waitForSelector('[name="education_level"]');
  await set('education_level', 'Masters'); await set('degree', 'MSc Physics');
  await set('occupation', data.occupation); await set('employment_status', 'Employed'); await set('monthly_income', '80K');
  await next();
  await page.waitForSelector('[name="religion"]');
  await set('religion', 'Islam'); await set('sect', 'Sunni');
  await next();
  await page.waitForSelector('#country_id');
  await set('country_id', 'Pakistan');
  await set('city', data.city); await set('residence_area', 'Village'); await set('home_ownership', 'Own'); await set('current_residence', 'Secret House 42, Gulgasht');
  await next();
  await page.waitForSelector('[name="father_status"]');
  await set('father_status', 'Alive'); await set('mother_status', 'Alive'); await set('brothers', '2'); await set('sisters', '5');
  await next();
  await page.waitForSelector('textarea[name="partner_demand"]');
  await set('partner_demand', data.demand); await set('pref_age_min', '24'); await set('pref_age_max', '36');
  await next();
  await page.waitForSelector('text=Get the blue verified tick');
}

const applicant = {
  demand: 'پتوکی سے رشتہ ہے۔ جو جائز ڈیمانڈ ہوگی پوری کریں گے۔\nAn educated partner from a good family.',
  personal: { headline_ur: 'صدیعہ', full_name: 'Sadia Secretsurname', gender: 'female', date_of_birth: `${year - 28}-05-05`, height_cm: '165', marital_status: 'Never married', mother_tongue: 'Saraiki', caste: 'Jutt', nationality: 'Pakistani', origin_country: 'Pakistan', origin_city: 'Multan', profile_created_by: 'Self' },
  occupation: 'Physicist', city: 'Multan', description: 'Kind and hardworking. <img src=x onerror=alert(1)>', phone: '0301 7654321', email: 'sadia@test.local',
};

let manageUrl; let code;

await step('homepage renders the new sections in order', async () => {
  const page = await newPage();
  await page.goto('/');
  for (const name of ['Pakistan Proposals', 'Overseas Proposals', 'Gulf Proposals', 'Second Marriage Proposals', 'Government Registered Marriage Bureau']) {
    assert.ok(await page.getByRole('heading', { name, level: 2 }).first().isVisible(), name);
  }
  assert.equal(await page.getByText('Offering Rishta Services').count(), 0, 'packages are not on the homepage');
  assert.equal(await page.getByText('A registered and trusted marriage bureau', { exact: false }).count(), 0);
  const order = await page.evaluate(() => ['home-search', 'pakistan-proposals', 'overseas-proposals', 'gulf-proposals', 'second-marriage-proposals', 'why-choose', 'registration', 'android-app'].map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -1));
  assert.ok(order.every((top, index) => top > 0 && (index === 0 || top > order[index - 1])), `sections in order: ${order}`);
  assert.equal(await page.locator('#home-search').evaluate((input) => input.form.querySelectorAll('input:not([type=hidden]), select').length), 1, 'the search bar has one field only');
  assert.equal(await page.locator('#home-search').evaluate((input) => !!input.closest('section[aria-label="Al Zaujain highlights"]')), true, 'the search bar sits inside the banner');
  for (const old of ['From a first conversation', 'A personal approach.', 'Your questions.']) assert.equal(await page.getByText(old).count(), 0, `${old} is gone`);
  assert.ok(await page.locator('#registration img[alt="FBR Pakistan"]').isVisible(), 'the FBR logo is shown');
  assert.ok(await page.locator('#contact').isVisible(), 'Contact us lands on the footer contacts');
  await page.context().close();
});

await step('the WhatsApp Channel welcome shows on every load, until the visitor joins', async () => {
  const page = await newPage({ welcome: true });
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Join Al Zaujain on WhatsApp' });
  await dialog.waitFor({ timeout: 8000 });
  assert.equal(await dialog.getByRole('link', { name: 'Join WhatsApp Channel' }).getAttribute('href'), 'https://whatsapp.com/channel/0029VaddRahADTOD4MXm3T25');
  await dialog.getByRole('button', { name: 'Maybe later' }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.reload();
  await dialog.waitFor({ timeout: 8000 });
  // Joining is remembered: no more welcome after that.
  await page.evaluate(() => localStorage.setItem('az_channel_welcome', JSON.stringify({ choice: 'joined', at: Date.now() })));
  await page.reload();
  await page.waitForTimeout(2600);
  assert.equal(await page.getByRole('dialog').count(), 0, 'not shown after joining');
  await page.context().close();
});

await step('wizard enforces validation step by step', async () => {
  const page = await newPage();
  await page.goto('/submit-profile');
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('text=Full name is required');
  await page.fill('[name=date_of_birth]', `${year - 16}-01-01`);
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('text=you must be at least 18');
  assert.equal(await page.locator('[name=education_level]').count(), 0, 'must not advance');
  await page.context().close();
});

await step('rejects a fake image upload and keeps the form', async () => {
  const page = await newPage();
  await page.goto('/submit-profile');
  await fillWizard(page, { ...applicant, email: 'fake@test.local' });
  await page.locator('input[type=file]').first().setInputFiles(fakePath);
  // The card-photo cropper opens; a broken file cannot be used, so the family cancels it.
  await page.getByRole('dialog', { name: 'Adjust card photo' }).getByRole('button', { name: 'Cancel' }).click();
  await page.locator('input[type=checkbox]').last().check();
  await page.click('button:has-text("Submit profile")');
  await page.waitForSelector('text=not a valid image');
  assert.equal(await db.profile.count({ where: { contact_email: 'fake@test.local' } }), 0);
  await page.context().close();
});

await step('login-free submission with photo and CNIC', async () => {
  const page = await newPage();
  await page.goto('/submit-profile');
  await fillWizard(page, applicant);
  await page.locator('input[type=file]').nth(0).setInputFiles(photoPath);
  // Like a WhatsApp picture: drag the photo in the circle, zoom, and use it.
  const cropper = page.getByRole('dialog', { name: 'Adjust card photo' });
  await cropper.waitFor();
  await cropper.getByRole('slider', { name: 'Zoom' }).fill('2');
  const stage = await cropper.getByRole('application').boundingBox();
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width / 2 + 40, stage.y + stage.height / 2 + 30, { steps: 5 });
  await page.mouse.up();
  await cropper.getByRole('button', { name: 'Use this photo' }).click();
  await cropper.waitFor({ state: 'detached' });
  await page.waitForSelector('text=How your photos appear on proposal cards');
  await page.locator('input[type=file]').nth(1).setInputFiles(cnicPath);
  await page.click('button:has-text("Submit profile")');
  await page.waitForSelector('text=Please confirm the consent statement');
  await page.locator('input[type=checkbox]').last().check();
  await page.click('button:has-text("Submit profile")');
  await page.waitForURL('**/manage/**');
  manageUrl = page.url();
  code = (await page.locator('h1').innerText()).match(/AZ-\d+/)[0];
  await page.waitForSelector('text=Waiting for review');
  await page.waitForSelector('text=Verification pending');
  await page.context().close();
  assert.ok(lastEmailTo('sadia@test.local').includes('CNIC'), 'emails were sent');
});

await step('copy, image and PDF export work', async () => {
  const page = await newPage();
  await page.goto(manageUrl);
  await page.click('button:has-text("Copy complete profile")');
  await page.waitForSelector('text=copied to your clipboard');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /CANDIDATE INFORMATION\nName: Sadia Secretsurname/);
  assert.match(copied, /PARTNER REQUIREMENTS\nپتوکی سے رشتہ ہے/);

  const [imageDownload] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('button:has-text("Download image")')]);
  const imagePath = path.join(dir, 'export.png');
  await imageDownload.saveAs(imagePath);
  const meta = await sharp(imagePath).metadata();
  assert.equal(meta.format, 'png');
  assert.equal(meta.width, 1588);
  fs.copyFileSync(imagePath, process.env.EXPORT_COPY_PNG ?? path.join(dir, 'copy.png'));

  await page.waitForSelector('text=profile image has been downloaded');
  const [pdfDownload] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('button:has-text("Download PDF")')]);
  const pdfPath = path.join(dir, 'export.pdf');
  await pdfDownload.saveAs(pdfPath);
  const pdf = fs.readFileSync(pdfPath);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 20000);
  fs.copyFileSync(pdfPath, process.env.EXPORT_COPY_PDF ?? path.join(dir, 'copy.pdf'));
  await page.context().close();
});

await step('pending profile is hidden from the public', async () => {
  assert.equal((await fetch(`${BASE}/profile/${code}`)).status, 404);
  const listing = await (await fetch(`${BASE}/proposals?q=Physicist`)).text();
  assert.ok(!listing.includes(code));
  const row = await db.profilePhoto.findFirst({ orderBy: { id: 'desc' } });
  assert.equal((await fetch(`${BASE}/media/photos/${row.thumb}`)).status, 404);
});

await step('CNIC cannot be reached without admin rights', async () => {
  const id = Number(code.replace('AZ-', ''));
  assert.equal((await fetch(`${BASE}/api/admin/cnic/${id}/front`)).status, 404);
  const file = (await db.cnicDocument.findUnique({ where: { profile_id: id } })).front_file;
  for (const url of [`/storage/private/cnic/${file}`, `/private/cnic/${file}`, `/media/photos/${file}`, `/media/photos/..%2F..%2Fprivate%2Fcnic%2F${file}`]) {
    assert.notEqual((await fetch(`${BASE}${url}`)).status, 200, url);
  }
  assert.ok(!fs.existsSync(path.join(process.cwd(), 'public', 'private')));
});

await step('cross-origin and unauthorised writes are refused', async () => {
  const form = new FormData();
  form.append('data', '{}');
  const foreign = await fetch(`${BASE}/api/profiles`, { method: 'POST', body: form, headers: { Origin: 'https://evil.example' } });
  assert.equal(foreign.status, 403);
  const form2 = new FormData();
  form2.append('data', '{}');
  const anonymous = await fetch(`${BASE}/api/profiles/${code}`, { method: 'PATCH', body: form2, headers: { Origin: BASE } });
  assert.equal(anonymous.status, 403);
  const wrongToken = new FormData();
  wrongToken.append('data', '{}');
  wrongToken.append('manage_token', 'guess');
  assert.equal((await fetch(`${BASE}/api/profiles/${code}`, { method: 'PATCH', body: wrongToken, headers: { Origin: BASE } })).status, 403);
});

await step('roles are enforced', async () => {
  const anon = await newPage();
  await anon.goto('/admin');
  assert.match(anon.url(), /\/login/);
  await anon.goto('/consultant');
  assert.match(anon.url(), /\/consultant\/login/);
  await anon.context().close();

  const email = 'plain@test.local';
  await db.user.create({ data: { email, password_hash: hashPassword('Plain-pass-123'), name: 'Plain' } });
  const page = await newPage();
  await signIn(page, email, 'Plain-pass-123');
  await page.waitForURL('**/dashboard');
  for (const url of ['/admin', '/admin/users', '/admin/smtp', '/consultant']) {
    await page.goto(url);
    assert.ok(!page.url().includes(url), url);
  }
  assert.equal((await page.request.get(`/api/admin/cnic/${Number(code.replace('AZ-', ''))}/front`)).status(), 404);
  await page.context().close();
});

let adminPage;
await step('admin approves, sees and verifies the CNIC', async () => {
  adminPage = await newPage();
  await signIn(adminPage, ADMIN.email, ADMIN.password);
  await adminPage.waitForURL('**/admin');
  await adminPage.goto(`/admin/profiles/${code}`);
  await adminPage.click('button:has-text("Approve")');
  await adminPage.waitForSelector('button:has-text("Remove from homepage"), button:has-text("Feature on homepage")');
  await adminPage.waitForFunction(() => !document.body.innerText.includes('Approve\n'));
  const id = Number(code.replace('AZ-', ''));
  const cnic = await adminPage.request.get(`/api/admin/cnic/${id}/front`);
  assert.equal(cnic.status(), 200);
  assert.match(cnic.headers()['cache-control'], /no-store/);
  await adminPage.goto('/admin/verification');
  await adminPage.click('button:has-text("Verify")');
  await adminPage.waitForTimeout(900);
  assert.equal((await db.profile.findUnique({ where: { id } })).verification_status, 'verified');
  assert.ok(await db.activityLog.findFirst({ where: { action: 'cnic_viewed' } }), 'CNIC views are logged');
  assert.match(lastEmailTo('sadia@test.local'), /verified/i);
});

await step('public profile shows the blue tick and no private data', async () => {
  const page = await newPage();
  await page.goto(`/profile/${code}`);
  await page.waitForSelector('h1:has-text("Sadia")');
  await page.waitForSelector('section[aria-label="Candidate information"]');
  const demand = await page.locator('section[aria-label="Partner requirements"]').innerText();
  assert.match(demand, /پتوکی سے رشتہ ہے/);
  assert.ok(!(await page.locator('section[aria-label="Candidate information"]').innerText()).includes('پتوکی سے رشتہ ہے'), 'demand stays separate');
  assert.equal(await page.locator('section[aria-label="Partner requirements"] p[dir="rtl"]').count() > 0, true, 'Urdu reads right to left');
  await page.click('button:has-text("Copy profile")');
  await page.waitForSelector('text=copied to your clipboard');
  const publicCopy = await page.evaluate(() => navigator.clipboard.readText());
  for (const secret of ['Secretsurname', '0301 7654321', 'sadia@test.local', 'Secret House']) assert.ok(!publicCopy.includes(secret), `public copy leaks ${secret}`);
  assert.ok(await page.locator('[title="Verified profile"]').first().isVisible());
  const html = await page.content();
  for (const secret of ['Secretsurname', '0301 7654321', 'sadia@test.local', 'Secret House 42', `${year - 28}-05-05`]) assert.ok(!html.includes(secret), secret);
  assert.ok(await page.getByText('<img src=x onerror=alert(1)>').first().isVisible(), 'description is shown as text');
  await page.context().close();
});

await step('search finds profiles by caste, and listings hide private data', async () => {
  const page = await newPage();
  await page.goto('/proposals');
  await page.fill('#filters input[name=q]', 'Jutt');
  await page.locator('#filters button[type=submit]').first().click();
  await page.waitForURL('**/proposals?**');
  await page.waitForSelector('text=1 proposal found');
  assert.ok(await page.getByRole('heading', { name: /Sadia/ }).isVisible());
  assert.ok(!(await page.content()).includes('Secretsurname'));
  await page.context().close();
});

await step('category pages and filters work', async () => {
  const page = await newPage();
  for (const slug of ['pakistan', 'united-kingdom', 'europe', 'united-states', 'gulf', 'gulf/saudi-arabia', 'gulf/qatar', 'pakistan/multan']) {
    assert.equal((await page.goto(`/proposals/${slug}`)).status(), 200, slug);
  }
  await page.goto('/proposals/pakistan/multan');
  await page.waitForSelector('text=1 proposal found');
  await page.goto('/proposals/gulf');
  await page.waitForSelector('text=0 proposals found');
  await page.goto('/proposals?verified=1&gender=female&age_min=25&age_max=30');
  await page.waitForSelector('text=1 proposal found');
  await page.goto('/proposals?gender=male');
  await page.waitForSelector('text=0 proposals found');
  await page.context().close();
});

await step('admin can manage categories, and they go live', async () => {
  await adminPage.goto('/admin/categories');
  const form = adminPage.locator('form').filter({ has: adminPage.getByPlaceholder('Category name') }).last();
  await form.getByPlaceholder('Category name').fill('North America');
  await form.locator('button[type=submit]').click();
  await adminPage.waitForFunction(() => [...document.querySelectorAll('input[name=name]')].some((input) => input.value === 'North America'));
  assert.equal((await fetch(`${BASE}/proposals/north-america`)).status, 200);
});

let memberPage;
await step('smart signup: password shown, copied, signed in straight to the dashboard', async () => {
  const before = emails.length;
  memberPage = await newPage();
  await memberPage.goto('/register');
  const password = memberPage.locator('#password');
  await memberPage.waitForFunction(() => document.querySelector('#password').value.length === 16);
  const generated = await password.inputValue();
  assert.ok(/[a-z]/i.test(generated) && /\d/.test(generated) && /[!@#$%&*?]/.test(generated), 'strong password');
  await memberPage.click('button:has-text("New password")');
  assert.notEqual(await password.inputValue(), generated, 'can be regenerated');
  await memberPage.click('[aria-label="Copy password"]');
  await memberPage.waitForSelector('text=Password copied');
  const shown = await password.inputValue();
  assert.equal(await memberPage.evaluate(() => navigator.clipboard.readText()), shown);
  assert.equal(await password.getAttribute('readonly'), '', 'locked until the member chooses their own');
  await memberPage.click('button:has-text("Use my own")');
  await password.fill('My-own-pass-1234');
  await memberPage.click('button:has-text("New password")');
  const finalPassword = await password.inputValue();
  await memberPage.fill('form [name=name]', 'Sadia');
  await memberPage.fill('form [name=email]', 'sadia@test.local');
  await memberPage.fill('form [name=phone]', '0301 7654321');
  await memberPage.click('button:has-text("Create my account")');
  await memberPage.waitForURL('**/dashboard?welcome=1');
  await memberPage.waitForSelector('text=Welcome, Sadia');
  assert.equal(emails.length, before, 'registration sends no email');
  assert.equal(await memberPage.getByText('confirm your email', { exact: false }).count(), 0);
  assert.ok(!serverLog.includes(finalPassword), 'password never reaches the logs');
  const stored = await db.user.findUnique({ where: { email: 'sadia@test.local' } });
  assert.ok(stored.password_hash.startsWith('scrypt$') && !stored.password_hash.includes(finalPassword));
  await memberPage.context().close();
  memberPage = await newPage();
  await signIn(memberPage, 'sadia@test.local', finalPassword);
  await memberPage.waitForURL('**/dashboard');
});

await step('the same email alone does not take over a guest profile', async () => {
  assert.equal(await db.profile.count({ where: { user: { email: 'sadia@test.local' } } }), 0);
  await memberPage.goto('/dashboard/profile');
  await memberPage.waitForSelector('text=You have not created a biodata yet');
});

await step('the private manage link adds a guest profile to an account', async () => {
  await memberPage.goto(manageUrl);
  await memberPage.click('button:has-text("Add to my account")');
  await memberPage.waitForURL('**/dashboard');
  await memberPage.waitForSelector(`text=Profile ID ${code}`);
  await memberPage.goto(manageUrl);
  assert.equal(await memberPage.locator('button:has-text("Add to my account")').count(), 0);
});

await step('signing up from a manage link adds the profile immediately', async () => {
  const fresh = await newPage();
  await fresh.goto('/submit-profile');
  await fillWizard(fresh, { ...applicant, email: 'second@test.local', personal: { ...applicant.personal, full_name: 'Second Applicant' } });
  await fresh.locator('input[type=checkbox]').last().check();
  await fresh.click('button:has-text("Submit profile")');
  await fresh.waitForURL('**/manage/**');
  await fresh.click('a:has-text("Create account")');
  await fresh.waitForURL('**/register?claim=**');
  await fresh.waitForFunction(() => document.querySelector('#password').value.length === 16);
  await fresh.fill('form [name=name]', 'Second');
  await fresh.fill('form [name=email]', 'someone-else@test.local');
  await fresh.fill('form [name=phone]', '0300 1111111');
  await fresh.click('button:has-text("Create my account")');
  await fresh.waitForURL('**/dashboard?welcome=1');
  await fresh.goto('/dashboard/profile');
  await fresh.waitForSelector('text=Second Applicant');
  await fresh.context().close();
});

await step('the dashboard shows real figures and all ten sections open', async () => {
  await memberPage.goto('/dashboard');
  for (const text of ['Welcome back, Sadia', 'Profile views', 'Matching proposals', 'Saved profiles', 'Unread messages', 'Verification status', 'Recommended matches']) await memberPage.waitForSelector(`text=${text}`);
  assert.ok(await memberPage.getByText('Verified', { exact: true }).first().isVisible());
  const links = [['Overview', '/dashboard'], ['My Matrimonial Profile', `/dashboard/profiles/${code}`], ['Edit Profile', `/dashboard/profiles/${code}/edit`], ['Partner Preferences', '/dashboard/preferences'], ['Recommended Matches', '/dashboard/matches'], ['Saved Profiles', '/dashboard/saved'], ['Profile Views', '/dashboard/views'], ['Messages', '/messages'], ['Notifications', '/dashboard/notifications'], ['Account Settings', '/dashboard/settings']];
  for (const [label, url] of links) {
    await memberPage.locator('nav[aria-label="Dashboard"]').getByRole('link', { name: label }).click();
    await memberPage.waitForURL(`**${url}`);
    assert.equal((await memberPage.locator('nav[aria-label="Dashboard"] [aria-current="page"]').innerText()).split('\n')[0], label);
  }
});

await step('notification centre shows approval and verification', async () => {
  await db.notification.updateMany({ where: { user: { email: 'sadia@test.local' } }, data: {} });
  const owner = await db.user.findUnique({ where: { email: 'sadia@test.local' } });
  const { notify } = await import('../../lib/notifications.js');
  await notify(owner.id, { type: 'verification', title: 'Your profile is verified', href: '/dashboard/profile' });
  await memberPage.goto('/dashboard');
  await memberPage.click('[aria-label^="Notifications,"]');
  await memberPage.waitForSelector('text=Your profile is verified');
  await memberPage.click('button:has-text("Mark all as read")');
  await memberPage.waitForTimeout(600);
  assert.equal(await db.notification.count({ where: { user_id: owner.id, read_at: null } }), 0);
});

await step('partner preferences save on their own and return to review', async () => {
  await memberPage.goto('/dashboard/preferences', { waitUntil: 'networkidle' });
  await memberPage.fill('textarea[name=partner_demand]', 'لڑکا تعلیم یافتہ ہو۔');
  await memberPage.fill('[name=pref_age_max]', '40');
  await memberPage.click('button:has-text("Save partner requirements")');
  await memberPage.waitForSelector('text=Our team will review');
  const row = await db.profile.findUnique({ where: { id: Number(code.replace('AZ-', '')) } });
  assert.equal(row.partner_demand, 'لڑکا تعلیم یافتہ ہو۔');
  assert.equal(row.pref_age_max, 40);
  assert.equal(row.full_name, 'Sadia Secretsurname', 'candidate details untouched');
  assert.equal(row.status, 'pending');
  await adminPage.goto(`/admin/profiles/${code}`);
  await adminPage.click('button:has-text("Approve")');
  await adminPage.waitForSelector('button:has-text("Delete permanently")');
  await adminPage.waitForTimeout(500);
});

await step('owner can edit, and editing returns the profile to review', async () => {
  await memberPage.goto(`/dashboard/profiles/${code}/edit`, { waitUntil: 'networkidle' });
  await memberPage.fill('textarea[name=description]', 'Updated description.');
  for (let index = 0; index < 6; index += 1) await memberPage.click('button:has-text("Continue")');
  await memberPage.click('button:has-text("Save changes")');
  await memberPage.waitForURL(`**/dashboard/profiles/${code}`);
  await memberPage.waitForSelector('text=Waiting for review');
  assert.equal((await fetch(`${BASE}/profile/${code}`)).status, 404);
  await adminPage.goto(`/admin/profiles/${code}`);
  await adminPage.click('button:has-text("Approve")');
  await adminPage.waitForSelector('button:has-text("Delete permanently")');
  await new Promise((resolve) => { setTimeout(resolve, 500); });
  assert.equal((await fetch(`${BASE}/profile/${code}`)).status, 200);
});

await step('forgot and reset password, with old sessions ended', async () => {
  const page = await newPage();
  await page.goto('/forgot-password');
  await page.fill('[name=email]', 'sadia@test.local');
  await page.click('button[type=submit]');
  await page.waitForSelector('text=a reset link is on its way');
  const reset = linkIn(lastEmailTo('sadia@test.local'), '/reset-password/');
  assert.ok(reset);
  await page.goto(reset);
  await page.fill('[name=password]', 'Brand-new-pass-1');
  await page.fill('[name=confirm]', 'Brand-new-pass-1');
  await page.click('button[type=submit]');
  await page.waitForURL('**/login?notice=password-reset');
  await page.goto(reset);
  await page.waitForSelector('text=This link has expired');
  await memberPage.goto('/dashboard');
  assert.match(memberPage.url(), /\/login/, 'old session ended');
  await signIn(memberPage, 'sadia@test.local', 'Brand-new-pass-1');
  await memberPage.waitForURL('**/dashboard');
  await page.goto('/forgot-password');
  await page.fill('[name=email]', 'nobody@test.local');
  await page.click('button[type=submit]');
  await page.waitForSelector('text=a reset link is on its way');
  await page.context().close();
});

await step('login is rate limited', async () => {
  const page = await newPage();
  for (let index = 0; index < 8; index += 1) {
    await signIn(page, 'victim@test.local', 'wrong-password');
    await page.waitForSelector('text=Incorrect email or password');
  }
  await signIn(page, 'victim@test.local', 'wrong-password');
  await page.waitForSelector('text=Too many attempts');
  await page.context().close();
});

let partnerPage; let partnerProfileId;
await step('two members chat with history and unread counts', async () => {
  const { createProfile } = await import('../../lib/profiles.js');
  const partner = (await db.user.create({ data: { email: 'hamid@test.local', password_hash: hashPassword('Hamid-pass-123'), name: 'Hamid', match_frequency: 'daily' } })).id;
  partnerProfileId = await createProfile({ full_name: 'Hamid Zafar', gender: 'male', date_of_birth: `${year - 30}-02-02`, marital_status: 'Never married', caste: 'Jutt', country_id: 1, city: 'Multan', education_level: 'Masters', occupation: 'Engineer', religion: 'Islam', sect: 'Sunni', contact_email: 'hamid@test.local', contact_phone: '0300 1112223', pref_age_min: 24, pref_age_max: 32 }, { status: 'approved', userId: partner });
  const partnerCode = `AZ-${String(partnerProfileId).padStart(2, '0')}`;

  await memberPage.goto(`/profile/${partnerCode}`);
  await memberPage.click('button:has-text("Chat now")');
  await memberPage.waitForURL('**/messages/**');
  await memberPage.fill('[aria-label="Write a message"]', 'Assalam-o-Alaikum');
  await memberPage.click('[aria-label="Send message"]');
  await memberPage.waitForSelector('text=Assalam-o-Alaikum');
  const conversationUrl = memberPage.url();

  partnerPage = await newPage();
  await signIn(partnerPage, 'hamid@test.local', 'Hamid-pass-123');
  await partnerPage.waitForURL('**/dashboard');
  await partnerPage.waitForSelector('[aria-label="Messages, 1 unread"]');
  await partnerPage.goto('/messages');
  await partnerPage.waitForSelector('[aria-label="1 unread"]');
  await partnerPage.goto(conversationUrl);
  await partnerPage.waitForSelector('text=Assalam-o-Alaikum');
  await partnerPage.fill('[aria-label="Write a message"]', 'Walaikum Assalam');
  await partnerPage.click('[aria-label="Send message"]');
  await memberPage.waitForSelector('text=Walaikum Assalam', { timeout: 10000 });

  const outsider = await newPage();
  await signIn(outsider, 'plain@test.local', 'Plain-pass-123');
  await outsider.waitForURL('**/dashboard');
  const id = conversationUrl.split('/').pop();
  assert.equal((await outsider.request.get(`/api/chat/${id}`)).status(), 404);
  assert.equal((await outsider.goto(`/messages/${id}`)).status(), 404);
  await outsider.context().close();
});

await step('admin controls chat globally and per user, and can read messages', async () => {
  const conversation = (await db.conversation.findFirst()).id;
  await adminPage.goto(`/admin/chat/${conversation}`);
  await adminPage.waitForSelector('text=Walaikum Assalam');

  await adminPage.goto('/admin/chat');
  await adminPage.uncheck('[name=chat_enabled]');
  await adminPage.click('button:has-text("Save chat settings")');
  await adminPage.waitForSelector('text=Chat settings saved');
  const partnerCode = `AZ-${String(partnerProfileId).padStart(2, '0')}`;
  await memberPage.goto(`/profile/${partnerCode}`);
  assert.equal(await memberPage.locator('button:has-text("Chat now")').count(), 0, 'chat button is hidden');
  const blocked = await memberPage.request.post(`/api/chat/${conversation}`, { data: { body: 'x' }, headers: { Origin: BASE } });
  assert.equal(blocked.status(), 403);
  await adminPage.check('[name=chat_enabled]');
  await adminPage.click('button:has-text("Save chat settings")');
  await adminPage.waitForSelector('text=Chat settings saved');

  const hamid = await db.user.findUnique({ where: { email: 'hamid@test.local' } });
  await adminPage.goto(`/admin/users/${hamid.id}`);
  await adminPage.click('button:has-text("Restrict chat")');
  await adminPage.waitForSelector('text=Chat restricted');
  await partnerPage.goto(`/messages/${conversation}`);
  await partnerPage.waitForSelector('text=Chat has been restricted');
  await adminPage.click('button:has-text("Allow chat")');
  await adminPage.waitForSelector('button:has-text("Restrict chat")');
});

await step('match email arrives once, and unsubscribe works', async () => {
  await adminPage.goto('/admin/matching');
  await adminPage.fill('[name=match_min_score]', '40');
  await adminPage.click('button:has-text("Save matching rules")');
  await adminPage.waitForSelector('text=Matching rules saved');
  const before = emails.length;
  await adminPage.click('button:has-text("Run matching now")');
  await adminPage.waitForSelector('text=/Sent [1-9]\\d* emails/');
  const mail = lastEmailTo('hamid@test.local');
  assert.match(mail, /new proposals|proposals for you/);
  assert.ok(mail.includes(code), 'contains the match');
  assert.ok(!mail.includes('Secretsurname'), 'matches never expose surnames');
  const sent = emails.length - before;
  assert.ok(sent >= 1);
  await adminPage.click('button:has-text("Run matching now")');
  await adminPage.waitForSelector('text=/Sent 0 emails/');
  assert.equal(emails.length - before, sent, 'no duplicates');
  const unsubscribe = linkIn(mail, '/unsubscribe');
  assert.ok(unsubscribe);
  assert.match(await (await fetch(unsubscribe.replace(/&amp;/g, '&'))).text(), /no longer receive/);
  assert.equal((await db.user.findUnique({ where: { email: 'hamid@test.local' } })).match_emails, false);
});

await step('saving a profile and honest view counts', async () => {
  const partnerCode = `AZ-${String(partnerProfileId).padStart(2, '0')}`;
  const before = (await db.profile.findUnique({ where: { id: partnerProfileId } })).views;
  await memberPage.goto(`/profile/${partnerCode}`);
  await memberPage.reload();
  await memberPage.reload();
  assert.ok((await db.profile.findUnique({ where: { id: partnerProfileId } })).views <= before + 1, 'refreshing does not inflate views');
  await memberPage.click('button:has-text("Save profile")');
  await memberPage.waitForSelector('button:has-text("Saved")');
  await memberPage.goto('/dashboard/saved');
  await memberPage.waitForSelector('text=Hamid');
  await memberPage.click('[aria-label="Remove from saved profiles"]');
  await memberPage.waitForTimeout(500);
  await memberPage.goto('/dashboard/saved');
  await memberPage.waitForSelector('text=No saved profiles yet');
});

await step('match percentage and sections appear on the profile page', async () => {
  const partnerCode = `AZ-${String(partnerProfileId).padStart(2, '0')}`;
  await memberPage.goto(`/profile/${partnerCode}`);
  await memberPage.waitForSelector('text=/\\d+% match with your profile/');
  await memberPage.goto(`/profile/${code}`);
  await memberPage.waitForSelector('text=Compatible proposals');
  await memberPage.waitForSelector('text=/\\d+% match/');
  await memberPage.goto('/dashboard/matches');
  await memberPage.waitForSelector('text=View profile');
});

await step('admin creates a consultant; the consultant sees only assigned work', async () => {
  await adminPage.goto('/admin/users/new', { waitUntil: 'networkidle' });
  await adminPage.check('input[value=consultant]');
  await adminPage.fill('[name=name]', 'Nasreen Akhtar');
  await adminPage.fill('[name=email]', 'nasreen@test.local');
  await adminPage.fill('[name=password]', 'Consult-pass-123');
  await adminPage.fill('[name=city]', 'Multan');
  await adminPage.click('button:has-text("Create account")');
  await adminPage.waitForSelector('text=Account created');
  const created = await db.consultant.findFirst({ where: { display_name: 'Nasreen Akhtar' } });
  await adminPage.goto(`/admin/consultants/${created.id}`);
  await adminPage.fill('[name=bio]', 'Twenty years helping families.');
  await adminPage.fill('[name=whatsapp]', '+92 300 765-4321');
  await adminPage.fill('[name=specialties]', 'Middle Class, Zzspecial Tag');
  await adminPage.fill('[name=rating]', '4.7');
  await adminPage.fill('[name=hours_from]', '00:00');
  await adminPage.fill('[name=hours_to]', '23:59');
  await adminPage.selectOption('[name=work_days]', 'everyday');
  await adminPage.setInputFiles('[name=photo]', photoPath);
  await adminPage.click('button:has-text("Save consultant")');
  await adminPage.waitForSelector('text=Consultant saved');
  assert.equal((await db.consultant.findUnique({ where: { id: created.id } })).whatsapp, '923007654321', 'a WhatsApp number typed with + and spaces is accepted and stored for wa.me');

  await adminPage.goto(`/admin/profiles/${code}`);
  await adminPage.selectOption('[name=consultant_id]', { label: 'Nasreen Akhtar' });
  await adminPage.click('button:has-text("Assign")');
  await adminPage.waitForTimeout(600);

  const listing = await newPage();
  await listing.goto('/consultants');
  const card = listing.locator('article', { hasText: 'Nasreen Akhtar' });
  await card.waitFor();
  for (const text of ['Zzspecial Tag', '4.7', 'Every Day | 12 AM - 11:59 PM', 'Online']) assert.ok(await card.getByText(text).first().isVisible(), text);
  assert.match(await card.getByRole('link', { name: /Connect with Nasreen Akhtar/ }).getAttribute('href'), /^https:\/\/wa\.me\//);
  await listing.goto(`/consultants/${created.slug}`);
  await listing.waitForSelector('text=Twenty years helping families.');
  await listing.context().close();

  const memberTry = await newPage();
  await signIn(memberTry, 'plain@test.local', 'Plain-pass-123', '/consultant/login');
  await memberTry.waitForSelector('text=for marriage consultants only');
  await memberTry.context().close();

  const page = await newPage();
  await signIn(page, 'nasreen@test.local', 'Consult-pass-123', '/consultant/login');
  await page.waitForURL('**/consultant');
  await page.goto('/consultant/profiles');
  await page.waitForSelector(`text=${code}`);
  assert.equal((await page.goto(`/consultant/profiles/AZ-${String(partnerProfileId).padStart(2, '0')}`)).status(), 404, 'unassigned profile is off limits');
  await page.goto(`/consultant/profiles/${code}`);
  await page.waitForSelector('text=sadia@test.local');
  await page.click('button:has-text("Suggest")');
  await page.waitForTimeout(600);
  await page.goto('/consultant/proposals');
  await page.waitForSelector('text=Hamid');
  await page.selectOption('[name=status]', 'shared');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(500);
  assert.equal((await db.matchProposal.findFirst()).status, 'shared');
  await page.goto(`/consultant/profiles/${code}`);
  await page.click('button:has-text("Message client")');
  await page.waitForURL('**/messages/**');
  assert.equal(await page.goto(`/consultant/profiles/${code}/edit`).then(() => page.url().endsWith('/edit')), false, 'no edit permission by default');
  await page.context().close();
});

await step('announcement bar scrolls above the navigation', async () => {
  const page = await newPage({ reducedMotion: 'no-preference' });
  await page.goto('/');
  assert.ok(await page.getByText('24/7 International Marriage Consultancy').first().isVisible());
  const name = await page.locator('.animate-marquee').evaluate((node) => getComputedStyle(node).animationName);
  assert.equal(name, 'marquee');
  const bar = await page.locator('.animate-marquee').boundingBox();
  const nav = await page.locator('nav[aria-label="Main navigation"]').boundingBox();
  assert.ok(bar.y < nav.y);
  await page.context().close();
});

await step('user management: search, full details, edit, password and delete', async () => {
  await adminPage.goto('/admin/users', { waitUntil: 'networkidle' });
  await adminPage.fill('input[name=q]', 'hamid');
  await adminPage.waitForURL('**q=hamid**');
  await adminPage.waitForSelector('text=hamid@test.local');
  assert.equal(await adminPage.locator('tbody tr').count(), 1, 'filters apply without a button');
  await adminPage.click('a:has-text("Hamid")');
  await adminPage.waitForURL(/\/admin\/users\/\d+$/);
  for (const text of ['Account details', 'Matrimonial profiles', 'Full biodata']) await adminPage.waitForSelector(`text=${text}`);
  await adminPage.waitForSelector('text=Hamid Zafar');
  await adminPage.fill('form:has([name=phone]) [name=phone]', '0300 7778889');
  await adminPage.click('button:has-text("Save changes")');
  await adminPage.waitForSelector('text=Your details have been saved');
  assert.equal((await db.user.findUnique({ where: { email: 'hamid@test.local' } })).phone, '0300 7778889');
  await adminPage.click('button:has-text("Set password")');
  await adminPage.waitForSelector('text=New password:');

  await db.user.create({ data: { email: 'gone@test.local', password_hash: 'x', name: 'Delete Me' } });
  await adminPage.goto('/admin/users?q=gone', { waitUntil: 'networkidle' });
  await adminPage.click('[aria-label="Delete user"]');
  await adminPage.waitForSelector('role=dialog');
  await adminPage.click('button:has-text("Cancel")');
  assert.ok(await db.user.findUnique({ where: { email: 'gone@test.local' } }), 'cancel keeps the user');
  await adminPage.click('[aria-label="Delete user"]');
  await adminPage.click('button:has-text("Yes, delete")');
  await adminPage.waitForFunction(() => !document.body.innerText.includes('gone@test.local'));
  assert.equal(await db.user.findUnique({ where: { email: 'gone@test.local' } }), null);
});

await step('profile can be deleted from the table, after confirming', async () => {
  const { createProfile } = await import('../../lib/profiles.js');
  const id = await createProfile({ full_name: 'Table Delete', gender: 'male', date_of_birth: `${year - 30}-02-02`, marital_status: 'Never married', caste: 'Jutt', country_id: 1, city: 'Multan', education_level: 'Masters', occupation: 'Engineer', religion: 'Islam', sect: 'Sunni', contact_email: 'td@test.local', contact_phone: '0300 1112223' }, { status: 'pending' });
  await adminPage.goto('/admin/profiles?q=Table', { waitUntil: 'networkidle' });
  await adminPage.click('[aria-label="Delete profile"]');
  await adminPage.click('button:has-text("Yes, delete")');
  await adminPage.waitForFunction(() => !document.body.innerText.includes('Table Delete'));
  assert.equal(await db.profile.findUnique({ where: { id } }), null);
});

await step('Urdu turns the whole layout right to left, on the public site and dashboards', async () => {
  const page = await newPage();
  const box = async (selector) => { const b = await page.locator(selector).first().boundingBox(); return b ? [Math.round(b.x), Math.round(b.width)] : null; };
  await page.goto('/');
  const navOrder = () => page.$$eval('nav[aria-label] > a, nav[aria-label] > div', (items) => items.map((item) => Math.round(item.getBoundingClientRect().x)));
  const navBefore = await navOrder();
  assert.ok(navBefore.every((x, index) => index === 0 || x > navBefore[index - 1]), 'English menu runs left to right');
  const before = await box('#registration ul');
  assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
  await page.click('button:has-text("اردو")');
  await page.waitForFunction(() => document.documentElement.lang === 'ur');
  await page.waitForSelector('text=حکومت سے رجسٹرڈ میرج بیورو');
  assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).direction), 'rtl', 'the page reads right to left');
  const after = await box('#registration ul');
  assert.ok(after[0] > before[0], 'the registration text moves to the other side');
  const navAfter = await navOrder();
  assert.ok(navAfter.every((x, index) => index === 0 || x < navAfter[index - 1]), 'the Urdu menu runs right to left');
  const width = page.viewportSize().width;
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width + 1, 'nothing overflows sideways');
  await page.goto('/proposals');
  await page.waitForSelector('text=تلاش اور فلٹر');
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'ur', 'the language persists');
  await signIn(page, 'plain@test.local', 'Plain-pass-123');
  await page.waitForURL('**/dashboard');
  await page.waitForSelector('text=آغاز بہت آسان ہے');
  const sidebar = await page.locator('aside').first().boundingBox();
  assert.ok(sidebar.x > width / 2, 'the dashboard menu sits on the right in Urdu');
  await page.context().close();
});

await step('every admin page loads', async () => {
  for (const url of ['/admin', '/admin/profiles', '/admin/profiles/new', '/admin/verification', '/admin/featured', '/admin/users', '/admin/consultants', '/admin/categories', '/admin/locations', '/admin/matching', '/admin/emails', '/admin/emails/password_reset', '/admin/smtp', '/admin/chat', '/admin/enquiries', '/admin/content', '/admin/faqs', '/admin/activity', '/admin/castes', '/admin/payment-requests', '/admin/payment-methods', '/admin/restrictions', '/admin/paid-users', '/admin/payment-history']) {
    assert.equal((await adminPage.goto(url)).status(), 200, url);
    // A class constant from a client module, used in a server class string, renders as error text.
    assert.equal(await adminPage.locator('[class*="Attempted to call"]').count(), 0, `${url} has broken styles`);
  }
});

await step('admin edits reach the public site', async () => {
  await adminPage.goto('/admin/featured');
  await adminPage.fill('[name=code]', code);
  await adminPage.click('button:has-text("Add")');
  await adminPage.waitForSelector(`text=${code} is now featured`);
  const page = await newPage();
  await page.goto('/');
  assert.ok(await page.locator('#pakistan-proposals').getByText('Sadia').first().isVisible(), 'a featured profile leads its proposals section');
  await page.context().close();
});

await step('homepage banners: image only by default, optional text placed by dragging, drag to reorder', async () => {
  const banner = path.join(dir, 'banner.jpg');
  await sharp({ create: { width: 1920, height: 700, channels: 3, background: '#7a3b52' } }).jpeg().toFile(banner);
  await adminPage.goto('/admin/homepage', { waitUntil: 'networkidle' });
  const add = adminPage.locator('form').filter({ has: adminPage.locator('button:has-text("Add banner")') });
  await add.locator('input[name=image]').setInputFiles(banner);
  await add.locator('button:has-text("Add banner")').click();
  await adminPage.waitForSelector('text=Banner added to the homepage');
  let home = await (await fetch(`${BASE}/`)).text();
  const heroRotates = (html) => /aria-roledescription="carousel" aria-label="Al Zaujain highlights"/.test(html);
  assert.ok(!heroRotates(home), 'one banner stands still');
  assert.ok(!home.includes('pakistani-couple'), 'the uploaded banner replaces the standard one');

  await adminPage.reload({ waitUntil: 'networkidle' });
  await add.locator('input[name=image]').setInputFiles(banner);
  await add.locator('input[name=show_text]').check();
  await add.locator('input[name=heading]').fill('Rishtay across the world');
  await add.locator('input[name=cta]').fill('See proposals');
  await add.locator('input[name=href]').fill('/proposals');
  const handle = add.getByRole('button', { name: /Text position/ });
  const frame = await handle.locator('xpath=..').boundingBox();
  await handle.hover();
  await adminPage.mouse.down();
  await adminPage.mouse.move(frame.x + frame.width * 0.5, frame.y + frame.height * 0.5, { steps: 6 });
  await adminPage.mouse.up();
  const x = Number(await add.locator('input[name=text_x]').inputValue());
  assert.ok(x > 40 && x < 60, `dragged to the middle (${x}%)`);
  await add.locator('button:has-text("Add banner")').click();
  await adminPage.waitForSelector('text=Banner added to the homepage');
  home = await (await fetch(`${BASE}/`)).text();
  assert.ok(heroRotates(home), 'two banners rotate');
  assert.ok(home.includes('Rishtay across the world') && home.includes('left:' + x.toString().replace(/\.0$/, '')) , 'the text sits where it was dragged');
  const stored = JSON.parse((await db.setting.findUnique({ where: { key: 'home_banners' } })).value);
  assert.deepEqual(stored.map((item) => item.showText), [false, true]);

  await adminPage.reload({ waitUntil: 'networkidle' });
  const tiles = adminPage.locator('[data-banner]');
  await tiles.nth(1).dragTo(tiles.nth(0));
  await adminPage.waitForSelector('text=Order saved.');
  const after = JSON.parse((await db.setting.findUnique({ where: { key: 'home_banners' } })).value);
  assert.deepEqual(after.map((item) => item.showText), [true, false], 'dragging changes the order');
});

await step('consultants can be for everyone, the team only, or one city', async () => {
  const make = async (name, audience, city = null) => {
    const user = await db.user.create({ data: { email: `${name.toLowerCase()}@consult.test`, password_hash: 'x', name, role: 'consultant' } });
    return db.consultant.create({ data: { user_id: user.id, slug: name.toLowerCase(), display_name: name, audience, audience_city: city, is_public: audience !== 'team' } });
  };
  await make('Everyonec', 'everyone');
  await make('Teamonlyc', 'team');
  await make('Multanc', 'city', 'Multan');
  const page = await newPage();
  await page.goto('/consultants');
  const listed = await page.content();
  assert.ok(listed.includes('Everyonec') && !listed.includes('Teamonlyc') && !listed.includes('Multanc'), 'all cities: only the consultants for everyone');
  await page.click('a:has-text("Multan")');
  await page.waitForURL('**city=Multan');
  const multan = await page.content();
  assert.ok(multan.includes('Multanc') && multan.includes('Everyonec') && !multan.includes('Teamonlyc'), 'Multan adds its own consultant');
  assert.equal((await fetch(`${BASE}/consultants/teamonlyc`)).status, 404, 'team consultants have no public page');
  const api = await (await fetch(`${BASE}/api/mobile/consultants?city=Multan`)).json();
  const names = api.consultants.map((item) => item.display_name);
  assert.ok(names.includes('Everyonec') && names.includes('Multanc') && !names.includes('Teamonlyc'), `the app gets the same list: ${names}`);
  const plain = (await (await fetch(`${BASE}/api/mobile/consultants?city=all`)).json()).consultants.map((item) => item.display_name);
  assert.ok(!plain.includes('Multanc'), 'without the city the city consultant stays hidden');
  assert.ok(api.cities.includes('Multan'));
  await page.context().close();
  await adminPage.goto('/admin/consultants', { waitUntil: 'networkidle' });
  await adminPage.waitForSelector('text=Multan only');
});

await step('homepage: one search box, second marriage lists, consultants on WhatsApp, packages on their own page', async () => {
  const pk = (await db.country.findFirst({ where: { name: 'Pakistan' } })).id;
  const seeking = await createProfile({ ...sampleProfile({ full_name: 'Zzdivorcee Khan', gender: 'female', marital_status: 'Divorced', city: 'Lahore' }), country_id: pk }, { status: 'approved' });
  const willing = await createProfile({ ...sampleProfile({ full_name: 'Zzwilling Bibi', gender: 'female', marital_status: 'Widowed', city: 'Multan' }), country_id: pk }, { status: 'approved' });
  await db.profile.update({ where: { id: willing }, data: { second_wife: 'Yes' } });
  const plain = await createProfile({ ...sampleProfile({ full_name: 'Zznever Married', gender: 'female', marital_status: 'Never married' }), country_id: pk }, { status: 'approved' });

  const page = await newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto('/', { waitUntil: 'networkidle' });
  const second = page.locator('#second-marriage-proposals');
  const firstTab = await second.locator('[role=tabpanel]').innerText();
  assert.ok(firstTab.includes('Zzdivorcee') && !firstTab.includes('Zznever'), 'divorced and widowed women look for a second marriage');
  await second.locator('[role=tab]:visible', { hasText: 'Willing To Be A Second Wife' }).click();
  const wifeTab = await second.locator('[role=tabpanel]').innerText();
  assert.ok(wifeTab.includes('Zzwilling') && !wifeTab.includes('Zzdivorcee'), 'only an explicit "Yes" counts as willing to be a second wife');

  const contact = page.locator('#consultants a', { hasText: 'Connect Now' }).first();
  assert.match(await contact.getAttribute('href'), /^https:\/\/wa\.me\/\d+\?text=Hello%2C%20I%20would%20like%20to%20consult/);

  await page.fill('#home-search', profileCode(seeking).toLowerCase());
  await page.locator('#home-search').press('Enter');
  await page.waitForURL('**/proposals?q=**');
  await page.waitForSelector('text=1 proposal found');
  assert.ok((await page.content()).includes('Zzdivorcee'), 'a profile ID finds that profile');
  await page.goto('/proposals?q=Lahore&second=seeking', { waitUntil: 'networkidle' });
  assert.ok((await page.content()).includes('Zzdivorcee'));

  await page.goto('/packages', { waitUntil: 'networkidle' });
  const consultancy = page.locator('#consultancy');
  assert.ok(await consultancy.getByText('5,000', { exact: true }).first().isVisible(), 'the registration fee is the price');
  assert.ok(await consultancy.getByText('Rs. 50,000').first().isVisible(), 'the finalization fee is listed');
  await page.context().close();

  const phone = await newPage({ viewport: { width: 375, height: 800 } });
  await phone.goto('/packages', { waitUntil: 'networkidle' });
  const slides = phone.locator('#consultancy [aria-roledescription=slide]');
  const box = await slides.first().boundingBox();
  assert.ok(box.width > 260 && box.width < 375, `one package at a time on a phone (${box.width}px)`);
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth) <= 375, 'no sideways scrolling');
  await phone.context().close();
  await db.profile.deleteMany({ where: { id: { in: [seeking, willing, plain] } } });
});

await step('the caste field takes a caste that is not in the list', async () => {
  const page = await newPage();
  await page.goto('/submit-profile');
  const box = page.locator('label:has-text("Caste / Biradari") [role=combobox], #caste').first();
  await box.fill('Zzkhokharnew');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('input[type=hidden][name=caste], input[name=caste]').first().inputValue(), 'Zzkhokharnew');
  await page.context().close();
});

await step('contact enquiry is stored and reaches the team', async () => {
  await adminPage.goto('/admin/content');
  await adminPage.fill('[name=admin_notify_email]', 'team@test.local');
  await adminPage.click('button:has-text("Save content")');
  await adminPage.waitForSelector('text=Website content saved');
  // The website's enquiry form now lives in the app; the same server code stores it.
  const sent = await fetch(`${BASE}/api/mobile/enquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Enquirer', phone: '0300 1234567', message: 'Please call me about a proposal.' }) });
  assert.equal(sent.status, 200);
  await adminPage.goto('/admin/enquiries');
  await adminPage.waitForSelector('text=Enquirer');
  assert.ok(lastEmailTo('team@test.local').includes('Enquirer'));
});

await step('SEO basics', async () => {
  const html = await (await fetch(`${BASE}/proposals/gulf`)).text();
  assert.match(html, /<title>Gulf Countries proposals \| Al Zaujain International Marriage Consultancy<\/title>/);
  assert.match(await (await fetch(`${BASE}/sitemap.xml`)).text(), /proposals\/gulf\/qatar/);
  assert.match(await (await fetch(`${BASE}/robots.txt`)).text(), /Disallow: \/admin/);
});

await step('no horizontal overflow at desktop, tablet or mobile', async () => {
  const demo = await db.profile.findFirst({ where: { status: 'approved' }, select: { id: true } });
  const urls = ['/', '/proposals', '/proposals/gulf', '/consultants', '/submit-profile', '/login', '/register', '/privacy', `/profile/AZ-${String(demo.id).padStart(2, '0')}`, '/dashboard', '/dashboard/matches', '/dashboard/saved', '/dashboard/views', '/dashboard/notifications', '/dashboard/settings', '/dashboard/preferences', '/messages'];
  for (const [width, height] of [[1440, 900], [1024, 768], [820, 1100], [390, 844], [360, 740]]) {
    const page = await newPage({ viewport: { width, height } });
    await signIn(page, 'sadia@test.local', 'Brand-new-pass-1');
    await page.waitForURL('**/dashboard');
    for (const url of urls) {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `${url} at ${width}px overflows by ${overflow}px`);
    }
    await page.context().close();
  }
});

await step('dashboard works on a phone', async () => {
  const page = await newPage({ viewport: { width: 390, height: 844 } });
  await signIn(page, 'sadia@test.local', 'Brand-new-pass-1');
  await page.waitForURL('**/dashboard');
  await page.locator('nav[aria-label="Quick navigation"]').getByRole('link', { name: 'Matches' }).click();
  await page.waitForURL('**/dashboard/matches');
  await page.click('[aria-label="Open menu"]');
  await page.locator('nav[aria-label="Dashboard"]').getByRole('link', { name: 'Saved Profiles' }).click();
  await page.waitForURL('**/dashboard/saved');
  await page.context().close();
});

await step('mobile navigation opens', async () => {
  for (const width of [360, 390]) {
    const page = await newPage({ viewport: { width, height: 800 } });
    await page.goto('/');
    const brand = await page.getByRole('link', { name: 'AL ZAUJAIN' }).first().boundingBox();
    assert.ok(brand.height < 60, `the name stays on one line (${brand.height}px)`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width, 'the bar fits the phone');
    assert.match(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), /^(only light|light only)$/, 'browsers may not force dark colours');
    await page.click('[aria-label="Open navigation"]');
    const menu = page.locator('#mobile-navigation');
    assert.ok(await menu.getByRole('button', { name: 'اردو' }).isVisible(), 'the language choice is in the menu');
    assert.equal(await menu.getByText('Consultants', { exact: true }).count(), 0, 'Consultants left the menu');
    await menu.getByText('Packages').click();
    await page.waitForURL('**/packages');
    await menu.waitFor({ state: 'detached' });
    await page.context().close();
  }
});

await step('payments: admin adds methods and turns restrictions on', async () => {
  await adminPage.goto('/admin/payment-methods/new');
  await adminPage.fill('input[name=name]', 'Meezan Test');
  await adminPage.fill('input[name=bank_name]', 'Meezan Bank');
  await adminPage.fill('input[name=account_holder]', 'Al Zaujain Accounts');
  await adminPage.fill('input[name=iban]', 'PK36MEZN0001234567890123');
  await adminPage.click('button:has-text("Save payment method")');
  await adminPage.waitForURL('**/admin/payment-methods');
  await db.paymentMethod.create({ data: { name: 'Hidden Method', account_holder: 'H', bank_name: 'H', iban: 'H1', active: false } });
  await adminPage.goto('/admin/restrictions');
  await adminPage.locator('input[name=photo]').check({ force: true });
  await adminPage.locator('input[name=inbox]').check({ force: true });
  await adminPage.locator('input[name=other]').check({ force: true });
  await adminPage.fill('input[name=access_price]', 'Rs 5,000');
  await adminPage.click('button:has-text("Save restrictions")');
  await adminPage.waitForSelector('text=Restrictions saved');
  const settings = Object.fromEntries((await db.setting.findMany({ where: { key: { startsWith: 'restrict_' } } })).map((row) => [row.key, row.value]));
  assert.equal(settings.restrict_photo, '1');
  assert.equal(settings.restrict_inbox, '1');
  assert.equal(settings.restrict_phone, '1');
});

const PAYER = { email: 'payer@test.local', password: 'Payer-pass-123' };
let payerPage; let paymentId; let photoFile; let originalPhoto; let photoBlurred;
await step('payments: unpaid members get no restricted data, by page or by URL', async () => {
  const id = Number(code.replace('AZ-', ''));
  await db.profile.update({ where: { id }, data: { status: 'approved', photo_public: true, contact_phone: '03017654321', contact_email: 'sadia@test.local', contact_whatsapp: '03017654321' } });
  await db.user.create({ data: { email: PAYER.email, password_hash: hashPassword(PAYER.password), name: 'Payer Person' } });
  photoFile = (await db.profilePhoto.findFirst({ where: { profile_id: id } })).file;
  originalPhoto = fs.readFileSync(path.join(dir, 'uploads', 'photos', photoFile));
  payerPage = await newPage();
  await signIn(payerPage, PAYER.email, PAYER.password);
  await payerPage.waitForURL('**/dashboard**');
  const response = await payerPage.request.get(`/profile/${code}`);
  const html = await response.text();
  for (const secret of ['03017654321', '0301 7654321', 'sadia@test.local', 'Secretsurname']) assert.ok(!html.includes(secret), `${secret} leaked`);
  const anonymous = await (await fetch(`${BASE}/profile/${code}`)).text();
  assert.ok(!anonymous.includes('sadia@test.local'));
  const direct = await payerPage.request.get(`/media/photos/${photoFile}`);
  assert.equal(direct.status(), 200);
  assert.match(direct.headers()['cache-control'], /no-store/);
  photoBlurred = await direct.body();
  assert.ok(!photoBlurred.equals(originalPhoto), 'the original file was served');
  const visitor = Buffer.from(await (await fetch(`${BASE}/media/photos/${photoFile}`)).arrayBuffer());
  assert.ok(!visitor.equals(originalPhoto), 'the original file was served to a visitor');
  assert.equal((await fetch(`${BASE}/_next/image?url=${encodeURIComponent(`/media/photos/${photoFile}`)}&w=640&q=75`)).status, 400, 'the image optimizer must not serve member photos');
  assert.equal((await fetch(`${BASE}/_next/image?url=${encodeURIComponent('/images/logo.png')}&w=640&q=75`)).status, 200);
});

await step('payments: the unlock popup appears, and messaging is refused by the API', async () => {
  await payerPage.goto(`/profile/${code}`, { waitUntil: 'networkidle' });
  await payerPage.click('button[aria-label="Unlock Full Profile Photograph"]');
  await payerPage.waitForSelector('text=View Payment Options');
  await payerPage.waitForSelector('text=Continue Browsing');
  await payerPage.click('text=Continue Browsing');
  assert.equal(await payerPage.locator('main a[href^="https://wa.me"]').count(), 0, 'WhatsApp is locked');
  await payerPage.click('main button:has-text("Contact Al Zaujain")');
  await payerPage.waitForSelector('text=View Payment Options');
  await payerPage.click('text=Continue Browsing');
  const peer = await db.user.findFirst({ where: { role: 'user', NOT: { email: PAYER.email } } });
  const payer = await db.user.findUnique({ where: { email: PAYER.email } });
  const own = await createProfile(sampleProfile(), { status: 'approved' });
  await db.profile.update({ where: { id: own }, data: { user_id: payer.id } });
  const conversation = await db.conversation.create({ data: { user_low: Math.min(payer.id, peer.id), user_high: Math.max(payer.id, peer.id) } });
  const refused = await payerPage.request.post(`/api/chat/${conversation.id}`, { data: { body: 'Hello there' }, headers: { origin: BASE } });
  assert.equal(refused.status(), 403);
  assert.equal((await refused.json()).upgrade, true);
  assert.equal(await db.message.count({ where: { conversation_id: conversation.id } }), 0);
});

await step('payments: a member submits a payment and it stays pending', async () => {
  await payerPage.goto('/dashboard/payments/submit', { waitUntil: 'networkidle' });
  assert.ok(!(await payerPage.content()).includes('Hidden Method'), 'inactive methods stay hidden');
  await payerPage.waitForSelector('text=PK36MEZN0001234567890123');
  await payerPage.click('button[aria-label^="Copy IBAN"]');
  assert.equal(await payerPage.evaluate(() => navigator.clipboard.readText()), 'PK36MEZN0001234567890123');
  await payerPage.fill('input[name=sender_name]', 'Payer Person');
  await payerPage.fill('input[name=transaction_id]', 'TXN-778899');
  await payerPage.fill('input[name=amount]', '5000');
  await payerPage.setInputFiles('input[name=receipt]', photoPath);
  await payerPage.click('button:has-text("Submit payment")');
  await payerPage.waitForURL('**/dashboard/payments');
  await payerPage.waitForSelector('text=Your payment is being reviewed');
  const row = await db.paymentRequest.findFirst({ where: { transaction_id: 'TXN-778899' } });
  paymentId = row.id;
  assert.equal(row.status, 'pending');
  const still = await payerPage.request.get(`/media/photos/${photoFile}`);
  assert.ok(!(await still.body()).equals(originalPhoto), 'nothing unlocks before approval');
});

await step('payments: forged approval, other accounts and visitors are refused', async () => {
  await payerPage.goto('/admin/payment-requests');
  assert.ok(!payerPage.url().includes('/admin/payment-requests'), 'a member reached the admin page');
  await payerPage.request.post('/api/payments', { multipart: { status: 'approved', method_id: '1', sender_name: 'x', transaction_id: 'FORGED', amount: '1' }, headers: { origin: BASE } });
  assert.equal(await db.paymentRequest.count({ where: { transaction_id: 'FORGED' } }), 0);
  assert.equal((await db.paymentRequest.findUnique({ where: { id: paymentId } })).status, 'pending');
  assert.equal(await db.memberAccess.count({ where: { user: { email: PAYER.email } } }), 0);
  assert.equal((await fetch(`${BASE}/api/payments/${paymentId}/receipt`)).status, 404);
  const stranger = await newPage();
  const other = await db.user.create({ data: { email: 'other-member@test.local', password_hash: hashPassword('Other-pass-123'), name: 'Other' } });
  await signIn(stranger, other.email, 'Other-pass-123');
  await stranger.waitForURL('**/dashboard**');
  assert.equal((await stranger.request.get(`/api/payments/${paymentId}/receipt`)).status(), 404);
  await stranger.context().close();
  assert.equal((await payerPage.request.get(`/api/payments/${paymentId}/receipt`)).status(), 200);
  const stored = (await db.paymentRequest.findUnique({ where: { id: paymentId } })).receipt_file;
  assert.ok(![...fs.readdirSync(path.join(dir, 'uploads', 'photos'))].includes(stored));
  assert.notEqual((await fetch(`${BASE}/media/photos/${stored}`)).status, 200);
});

await step('payments: admin reviews the receipt and approves, which unlocks everything', async () => {
  await adminPage.goto('/admin/payment-requests');
  await adminPage.waitForSelector('text=TXN-778899');
  await adminPage.goto(`/admin/payment-requests/${paymentId}`, { waitUntil: 'networkidle' });
  assert.ok(await adminPage.locator('img[alt="Payment receipt"]').evaluate((image) => image.naturalWidth > 0), 'admin can see the receipt');
  await adminPage.fill('textarea[name=admin_note]', 'Matched bank statement');
  await adminPage.click('button:has-text("Approve payment")');
  await adminPage.waitForFunction(() => document.body.innerText.includes('Reviewed'));
  const row = await db.paymentRequest.findUnique({ where: { id: paymentId } });
  assert.equal(row.status, 'approved');
  assert.equal(row.admin_note, 'Matched bank statement');
  const html = await (await payerPage.request.get(`/profile/${code}`)).text();
  assert.ok(html.includes('sadia@test.local'), 'contact is revealed');
  assert.ok(html.includes('Secretsurname'), 'full name is revealed');
  const photo = await payerPage.request.get(`/media/photos/${photoFile}`);
  assert.ok((await photo.body()).equals(originalPhoto), 'the blur is removed');
  await payerPage.goto(`/profile/${code}`, { waitUntil: 'networkidle' });
  assert.equal(await payerPage.locator('button[aria-label="Unlock Full Profile Photograph"]').count(), 0);
  assert.equal(await payerPage.locator('main a[href^="https://wa.me"]').count(), 1, 'WhatsApp opens after approval');
  await payerPage.goto('/dashboard/payments');
  await payerPage.waitForSelector('text=Your access is active');
  await payerPage.goto('/dashboard/notifications');
  await payerPage.waitForSelector('text=Full profile access');
  await payerPage.goto('/dashboard/payments/submit');
  await payerPage.waitForSelector('text=You do not need to pay again');
  await payerPage.goto('/dashboard/payments/unlocked');
  await payerPage.waitForSelector('text=Unlocked');
});

await step('payments: admin revokes and extends, and it takes effect at once', async () => {
  const payer = await db.user.findUnique({ where: { email: PAYER.email } });
  await adminPage.goto('/admin/paid-users?access=paid');
  await adminPage.waitForSelector(`text=${PAYER.email}`);
  await adminPage.goto(`/admin/users/${payer.id}`, { waitUntil: 'networkidle' });
  await adminPage.click('button:has-text("Revoke access")');
  await adminPage.waitForSelector('button:has-text("Grant access")');
  assert.ok(!(await (await payerPage.request.get(`/media/photos/${photoFile}`)).body()).equals(originalPhoto));
  assert.ok(!(await (await payerPage.request.get(`/profile/${code}`)).text()).includes('sadia@test.local'));
  await adminPage.click('button:has-text("Grant access")');
  await adminPage.waitForSelector('button:has-text("Revoke access")');
  assert.ok((await (await payerPage.request.get(`/media/photos/${photoFile}`)).body()).equals(originalPhoto));
  await db.memberAccess.update({ where: { user_id: payer.id }, data: { expires_at: new Date(Date.now() - 1000) } });
  assert.ok(!(await (await payerPage.request.get(`/profile/${code}`)).text()).includes('sadia@test.local'), 'expired access locks again');
  await adminPage.goto('/admin/payment-history');
  await adminPage.waitForSelector('text=TXN-778899');
  await payerPage.context().close();
  await db.setting.updateMany({ where: { key: { in: ['restrict_photo', 'restrict_inbox', 'restrict_other'] } }, data: { value: '0' } });
});

const BIODATA = fs.readFileSync(path.join(import.meta.dirname, '..', 'fixtures', 'biodata-alzaujain.txt'), 'utf8');
let importedCode; let premiumCode;
await step('profiles: admin pastes a biodata, reviews it and publishes it as Public', async () => {
  await adminPage.goto('/admin/profiles');
  await adminPage.click('a:has-text("Add New Profile")');
  await adminPage.waitForURL('**/admin/profiles/new');
  await adminPage.waitForLoadState('networkidle');
  await adminPage.fill('#biodata', BIODATA);
  await adminPage.click('button:has-text("Read biodata")');
  await adminPage.waitForSelector('text=details filled in');
  assert.equal(await adminPage.inputValue('input[name="full_name"]'), 'Ayesha Khan');
  assert.equal(await adminPage.inputValue('select[name="gender"]'), 'female');
  assert.equal(await adminPage.inputValue('input[name="city"]'), 'Multan');
  assert.match(await adminPage.inputValue('textarea[name="partner_demand"]'), /لڑکی تعلیم یافتہ/);
  assert.ok(await adminPage.evaluate(() => [...document.querySelectorAll('textarea')].some((node) => node.value.includes('Original reference: AZ-28'))), 'unplaced lines are kept');
  await adminPage.click('[role="radiogroup"] label:has-text("Free profile")');
  await adminPage.click('button:has-text("Save profile")');
  await adminPage.waitForURL(/\/admin\/profiles\/AZ-\d+$/);
  importedCode = adminPage.url().split('/').pop();
  const row = await db.profile.findUnique({ where: { id: Number(importedCode.replace('AZ-', '')) } });
  assert.equal(row.status, 'approved');
  assert.equal(row.access_type, 'public');
  assert.equal(row.source, 'admin');
  assert.equal(row.date_of_birth.toISOString().slice(0, 10), '1999-01-01');
  assert.match(row.extra_info, /AZ-28/);
  const html = await (await fetch(`${BASE}/profile/${importedCode}`)).text();
  assert.ok(html.includes('0300 555 1000'), 'a public profile shows contact details to everyone');
  assert.ok(html.includes('Ayesha Khan'), 'and the full name');
});

await step('profiles: pasting the same biodata again warns before a duplicate is saved', async () => {
  await adminPage.goto('/admin/profiles/new', { waitUntil: 'networkidle' });
  await adminPage.fill('#biodata', BIODATA);
  await adminPage.click('button:has-text("Read biodata")');
  await adminPage.waitForSelector('text=This may already be on file');
  await adminPage.click('button:has-text("Save profile")');
  await adminPage.waitForSelector('text=looks like one already on file');
  assert.equal(await db.profile.count({ where: { full_name: 'Ayesha Khan' } }), 1);
});

await step('profiles: admin corrects an imported profile', async () => {
  await adminPage.goto(`/admin/profiles/${importedCode}/edit`, { waitUntil: 'networkidle' });
  await adminPage.fill('input[name="occupation"]', 'Lecturer');
  await adminPage.click('button:has-text("Save changes")');
  await adminPage.waitForURL(`**/admin/profiles/${importedCode}`);
  const row = await db.profile.findUnique({ where: { id: Number(importedCode.replace('AZ-', '')) } });
  assert.equal(row.occupation, 'Lecturer');
  assert.equal(row.access_type, 'public', 'editing keeps the type');
});

await step('profiles: admin creates a Premium profile by hand', async () => {
  await adminPage.goto('/admin/profiles/new', { waitUntil: 'networkidle' });
  await adminPage.click('button[role="tab"]:has-text("Fill in manually")');
  await adminPage.fill('input[name="full_name"]', 'Zara Premium');
  await adminPage.selectOption('select[name="gender"]', 'female');
  await adminPage.fill('input[name="date_of_birth"]', `${year - 26}-03-03`);
  await adminPage.selectOption('select[name="marital_status"]', 'Never married');
  await typeInto(adminPage.locator('#country_id'), 'Pakistan');
  await typeInto(adminPage.locator('#city'), 'Lahore');
  await typeInto(adminPage.locator('#caste'), 'Rajput');
  await adminPage.fill('input[name="contact_phone"]', '0321 7778889');
  await adminPage.click('[role="radiogroup"] label:has-text("Exclusive")');
  await adminPage.click('button:has-text("Save profile")');
  await adminPage.waitForURL(/\/admin\/profiles\/AZ-\d+$/);
  premiumCode = adminPage.url().split('/').pop();
  const row = await db.profile.findUnique({ where: { id: Number(premiumCode.replace('AZ-', '')) } });
  assert.equal(row.access_type, 'premium');
  const page = await newPage();
  await page.goto(`/profile/${premiumCode}`);
  const html = await page.content();
  assert.ok(!html.includes('7778889'), 'premium contact stays private');
  const button = page.locator('a:has-text("Contact for Premium Proposal")');
  assert.match(await button.getAttribute('href'), /^https:\/\/wa\.me\//);
  await page.waitForSelector('text=Exclusive');
  await page.context().close();
});

await step('profiles: member submissions are Paid; admin switches Paid → Public → Premium', async () => {
  const member = await db.profile.findUnique({ where: { id: Number(code.replace('AZ-', '')) } });
  assert.equal(member.access_type, 'paid');
  assert.equal(member.source, 'user');
  const contactShown = async () => (await (await fetch(`${BASE}/profile/${premiumCode}`)).text()).includes('7778889');
  await db.profile.update({ where: { id: Number(premiumCode.replace('AZ-', '')) }, data: { access_type: 'paid' } });
  assert.equal(await contactShown(), false, 'paid hides contact from visitors');
  await adminPage.goto(`/admin/profiles/${premiumCode}`, { waitUntil: 'networkidle' });
  await adminPage.click('[role="radiogroup"] label:has-text("Free profile")');
  await adminPage.click('button:has-text("Change profile type")');
  await new Promise((resolve) => { setTimeout(resolve, 800); });
  assert.equal((await db.profile.findUnique({ where: { id: Number(premiumCode.replace('AZ-', '')) } })).access_type, 'public');
  assert.equal(await contactShown(), true, 'public opens it at once');
  await adminPage.reload({ waitUntil: 'networkidle' });
  await adminPage.click('[role="radiogroup"] label:has-text("Exclusive")');
  await adminPage.click('button:has-text("Change profile type")');
  await new Promise((resolve) => { setTimeout(resolve, 800); });
  assert.equal(await contactShown(), false, 'premium closes it again');
  await adminPage.goto('/admin/profiles?type=premium');
  await adminPage.waitForSelector(`text=${premiumCode}`);
  assert.equal(await adminPage.locator(`text=${importedCode}`).count(), 0, 'the type filter works');
});

await step('homepage search combines filters and returns database results', async () => {
  const page = await newPage();
  await page.goto('/proposals/pakistan/multan', { waitUntil: 'networkidle' });
  const form = page.locator('#filters');
  await form.locator('select[name="gender"]').selectOption('female');
  await pick(form, 'Caste / Biradari', 'Jutt');
  await form.locator('input[name="age_min"]').fill('22');
  await form.locator('input[name="age_max"]').fill('30');
  await form.locator('button[type=submit]').first().click();
  await page.waitForURL('**/proposals/pakistan/multan?**');
  const text = await page.content();
  assert.ok(text.includes(importedCode), 'the matching profile is found');
  assert.ok(!text.includes(premiumCode), 'a Rajput profile in Lahore is not');
  await page.goto('/');
  await page.locator('#gulf-proposals a:has-text("View Female Proposals")').click();
  await page.waitForURL('**/proposals/gulf?gender=female');
  await page.context().close();
});

await step('smart search: type to find a country, its cities follow, extra filters combine', async () => {
  const canada = await db.country.findUnique({ where: { name: 'Canada' } });
  const intl = await createProfile(sampleProfile({ full_name: 'Hamza Toronto', gender: 'male', country_id: canada.id, city: 'Toronto', caste: 'Arain', height_cm: 180, nationality: 'Canadian', marriage_location: 'Overseas' }), { status: 'approved' });
  const intlCode = profileCode(intl);
  const page = await newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#overseas-proposals [role=tab]:has-text("Canada Proposals")').first().click();
  assert.ok(await page.locator('#overseas-proposals').getByText('Hamza').first().isVisible(), 'the Canada tab lists the Toronto profile');
  await page.goto('/proposals/other-countries/canada', { waitUntil: 'networkidle' });
  const form = page.locator('#filters');
  await form.locator('details summary').first().click();
  await form.locator('select[name="height_min"]').selectOption('178');
  await pick(form, 'Nationality', 'Canadian');
  await form.locator('button[type=submit]').first().click();
  await page.waitForURL('**/proposals/other-countries/canada?**');
  assert.ok((await page.content()).includes(intlCode), 'the Toronto profile is found');
  await page.waitForSelector('text=1 proposal found');
  assert.equal(await page.locator('#filters details').getAttribute('open'), '', 'More filters opens when one is in use');
  await page.goto('/proposals?height_min=183', { waitUntil: 'networkidle' });
  assert.ok(!(await page.content()).includes(intlCode), 'too short for that height filter');
  assert.equal(await page.locator('[class*="Attempted to call"]').count(), 0, 'filter styles are intact');
  await page.goto('/proposals/other-countries', { waitUntil: 'networkidle' });
  assert.ok((await page.content()).includes(intlCode), 'Canada has its own category page');
  await page.goto(`/profile/${intlCode}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Preferred marriage location');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/proposals', { waitUntil: 'networkidle' });
  await page.locator('#filters label:has-text("Caste / Biradari") [role=combobox]').fill('raj');
  await page.waitForSelector('[role=option]:has-text("Rajput")');
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= 390, `no sideways scrolling on a phone (${width}px)`);
  await page.context().close();
});

await step('admin manages castes; a renamed caste follows on profiles and in the lists', async () => {
  await adminPage.goto('/admin/castes', { waitUntil: 'networkidle' });
  await adminPage.fill('input[placeholder="Caste name, or several separated by commas"]', 'Zzoldbiradari, Zzsecondbiradari');
  await adminPage.click('form:has(input[placeholder="Caste name, or several separated by commas"]) button[type=submit]');
  await adminPage.waitForFunction(() => [...document.querySelectorAll('input[name=name]')].some((input) => input.value === 'Zzsecondbiradari'));
  const id = await createProfile(sampleProfile({ full_name: 'Biradari Check', caste: 'Zzoldbiradari' }), { status: 'approved' });
  const caste = await db.caste.findUnique({ where: { name: 'Zzoldbiradari' } });
  await adminPage.fill(`input[form="caste-${caste.id}"][name=name]`, 'Zznewbiradari');
  await adminPage.click(`button[form="caste-${caste.id}"]`);
  await adminPage.waitForFunction(() => [...document.querySelectorAll('input[name=name]')].some((input) => input.value === 'Zznewbiradari'));
  assert.equal((await db.profile.findUnique({ where: { id } })).caste, 'Zznewbiradari', 'the profile follows the rename');
  const page = await newPage();
  await page.goto('/proposals', { waitUntil: 'networkidle' });
  const box = page.locator('#filters label:has-text("Caste / Biradari") [role=combobox]');
  await box.fill('zznew');
  await page.waitForSelector('[role=option]:has-text("Zznewbiradari")');
  await page.context().close();
  // Optional screenshots for a visual check: E2E_SHOTS=/some/folder npm run test:e2e
  if (process.env.E2E_SHOTS) {
    const shots = process.env.E2E_SHOTS;
    await adminPage.goto('/admin/castes', { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(shots, 'admin-castes.png') });
    await adminPage.context().addCookies([{ name: 'az_theme', value: 'dark', url: BASE }]);
    await adminPage.goto('/admin/castes', { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(shots, 'admin-castes-dark.png') });
    await adminPage.goto('/admin/profiles/new', { waitUntil: 'networkidle' });
    await adminPage.click('button[role="tab"]:has-text("Fill in manually")');
    await adminPage.evaluate(() => document.querySelector('#marriage_location').scrollIntoView({ block: 'center' }));
    await adminPage.click('#marriage_location');
    await adminPage.screenshot({ path: path.join(shots, 'admin-form-dark.png') });
    await adminPage.context().addCookies([{ name: 'az_theme', value: 'light', url: BASE }]);
    await adminPage.goto('/admin/locations', { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(shots, 'admin-locations.png') });
  }
});

await step('homepage proposal sections: tabs switch, cards open profiles, and the channel link is exact', async () => {
  const page = await newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto('/', { waitUntil: 'networkidle' });
  const section = page.locator('#pakistan-proposals');
  const tabs = section.locator('[role=tab]:visible');
  assert.ok(await tabs.count() >= 2, 'city tabs appear for cities with proposals');
  await tabs.nth(1).click();
  assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
  const card = section.locator('article').first();
  await card.locator('a:has-text("Profile Detail")').click();
  await page.waitForURL('**/profile/AZ-*');
  await page.goto('/', { waitUntil: 'networkidle' });
  const channel = page.locator('a[href="https://whatsapp.com/channel/0029VaddRahADTOD4MXm3T25"]');
  assert.equal(await channel.first().getAttribute('target'), '_blank');
  await page.context().close();
});

await step('admin can unpublish and publish again', async () => {
  await adminPage.goto(`/admin/profiles/${importedCode}`, { waitUntil: 'networkidle' });
  await adminPage.click('button:has-text("Unpublish")');
  await adminPage.waitForSelector('button:has-text("Publish")');
  assert.equal((await fetch(`${BASE}/profile/${importedCode}`)).status, 404);
  await adminPage.click('button:has-text("Publish")');
  await adminPage.waitForSelector('button:has-text("Unpublish")');
  assert.equal((await fetch(`${BASE}/profile/${importedCode}`)).status, 200);
});

await step('dark mode works on dashboards and leaves the public site alone', async () => {
  await adminPage.goto('/admin/payment-history', { waitUntil: 'networkidle' });
  const background = () => adminPage.locator('div.min-h-dvh').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  const light = await background();
  await adminPage.click('button[aria-label="Switch to dark mode"]');
  await adminPage.waitForSelector('button[aria-label="Switch to light mode"]');
  assert.notEqual(await background(), light);
  await adminPage.reload();
  await adminPage.waitForSelector('button[aria-label="Switch to light mode"]');
  await adminPage.click('button[aria-label="Switch to light mode"]');
  await adminPage.waitForSelector('button[aria-label="Switch to dark mode"]');
  assert.equal(await background(), light);
});

await step('admin deletes a profile and its private files go with it', async () => {
  const id = Number(code.replace('AZ-', ''));
  const document = await db.cnicDocument.findUnique({ where: { profile_id: id } });
  await adminPage.goto(`/admin/profiles/${code}`);
  await adminPage.click('button:has-text("Delete permanently")');
  await adminPage.waitForURL('**/admin/profiles');
  assert.equal((await fetch(`${BASE}/profile/${code}`)).status, 404);
  assert.ok(!fs.existsSync(path.join(dir, 'private', 'cnic', document.front_file)));
});

await browser.close();
smtp.close();
try { process.kill(-server.pid); } catch { /* already stopped */ }

await closeDb();
const unique = [...new Set(problems)];
if (unique.length) console.log(`\nBrowser errors (${unique.length}):\n${unique.slice(0, 12).join('\n')}`);
if (/error/i.test(serverLog)) console.log(`\nServer log:\n${serverLog.split('\n').filter((line) => /error/i.test(line)).slice(0, 12).join('\n')}`);
const failed = results.filter((line) => line.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed. Emails received: ${emails.length}`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
