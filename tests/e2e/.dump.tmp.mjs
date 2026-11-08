// Drives the real Flutter app (built for the web with AZ_SEMANTICS=true) against a real server and a
// fresh test database, the way a family would use it on a phone.
//   cd mobile-app && flutter build web --release --dart-define=AZ_SEMANTICS=true
//   npm run build && npm run test:mobile-app
// Screenshots go to $APP_SHOTS when it is set.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { prepareTestDatabase, sampleProfile } from '../helpers.mjs';

const API_PORT = 3214;
const APP_PORT = 3302;
const SITE = `http://localhost:${API_PORT}`;
const WEB = path.resolve('mobile-app/build/web');
const SHOTS = process.env.APP_SHOTS;
if (!fs.existsSync(path.join(WEB, 'main.dart.js'))) throw new Error('Build the web app first: cd mobile-app && flutter build web --release --dart-define=AZ_SEMANTICS=true');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-app-'));
const DATABASE_URL = await prepareTestDatabase();
const env = { ...process.env, DATABASE_URL, STORAGE_DIR: dir, APP_SECRET: crypto.randomBytes(32).toString('hex'), SITE_URL: SITE, SMTP_HOST: '127.0.0.1', SMTP_PORT: '2597' };
Object.assign(process.env, env);
const { closeDb, getDb } = await import('../../lib/db.js');
const { hashPassword } = await import('../../lib/security.js');
const { saveSettings } = await import('../../lib/settings.js');
const db = getDb();

const server = spawn('npx', ['next', 'start', '-p', String(API_PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let serverLog = '';
server.stdout.on('data', (data) => { serverLog += data; });
server.stderr.on('data', (data) => { serverLog += data; });
for (let attempt = 0; attempt < 60; attempt += 1) {
  try { if ((await fetch(`${SITE}/api/mobile/config`)).ok) break; } catch { /* starting */ }
  await new Promise((resolve) => { setTimeout(resolve, 500); });
}

// The web build, served like any static site.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const web = http.createServer((request, response) => {
  const url = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = path.join(WEB, url);
  if (!file.startsWith(WEB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB, 'index.html');
  response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => { web.listen(APP_PORT, resolve); });

// Sample data, created through the same API the app uses.
const api = async (method, route, { json, form, token } = {}) => {
  const response = await fetch(`${SITE}/api/mobile/${route}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(json ? { 'Content-Type': 'application/json' } : {}) }, body: json ? JSON.stringify(json) : form });
  return response.json();
};
const image = async (color) => new Blob([await sharp({ create: { width: 700, height: 700, channels: 3, background: color } }).jpeg().toBuffer()], { type: 'image/jpeg' });
const year = new Date().getFullYear();
async function seedProfile(values, color, extra = {}) {
  const form = new FormData();
  form.append('data', JSON.stringify(sampleProfile(values)));
  form.append('consent', 'yes');
  form.append('photos', await image(color), 'p.jpg');
  const { code } = await api('POST', 'profiles', { form });
  const id = Number(code.slice(3));
  await db.profile.update({ where: { id }, data: { status: 'approved', approved_at: new Date(), ...extra } });
  return code;
}
const sana = await seedProfile({ full_name: 'Sana Tariq', gender: 'female', caste: 'Arain', city: 'Multan', date_of_birth: `${year - 26}-02-02`, contact_phone: '0300 7654321', headline_ur: 'ثنا طارق', partner_demand: 'تعلیم یافتہ اور نیک رشتہ درکار ہے۔' }, '#b06070', { verification_status: 'verified', featured: true });
const hira = await seedProfile({ full_name: 'Hira Khan', gender: 'female', caste: 'Rajput', city: 'Lahore', date_of_birth: `${year - 29}-05-05`, occupation: 'Doctor' }, '#6070b0');
const bilalProfile = await seedProfile({ full_name: 'Bilal Ahmed', gender: 'male', caste: 'Jutt', city: 'Lahore', date_of_birth: `${year - 30}-03-03`, contact_email: 'bilal@test.local' }, '#50a070');
await seedProfile({ full_name: 'Usman Ali', gender: 'male', caste: 'Awan', city: 'London', country_id: (await db.country.findFirst({ where: { name: 'United Kingdom' } }))?.id ?? 1, nationality: 'British' }, '#a09050', { access_type: 'premium' });
const MEMBER = { email: 'bilal@test.local', password: 'Bilal-pass-123' };
const bilal = await db.user.create({ data: { email: MEMBER.email, password_hash: hashPassword(MEMBER.password), name: 'Bilal Ahmed', phone: '0300 1112223' } });
await db.profile.update({ where: { id: Number(bilalProfile.slice(3)) }, data: { user_id: bilal.id } });
const sanaUser = await db.user.create({ data: { email: 'sana@test.local', password_hash: hashPassword('Sana-pass-1234'), name: 'Sana Tariq' } });
await db.profile.update({ where: { id: Number(sana.slice(3)) }, data: { user_id: sanaUser.id } });
await db.paymentMethod.create({ data: { name: 'Meezan Bank', account_holder: 'Al Zaujain', bank_name: 'Meezan Bank Ltd', iban: 'PK36MEZN0001234567890123', active: true } });
await saveSettings({ access_price: 'Rs 5,000', announcements: 'New proposals every week\nOverseas rishtay from UK, USA and Gulf' });

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-chrome-'));
const context = await chromium.launchPersistentContext(profileDir, {
  executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
  args: ['--disable-web-security'],
  viewport: { width: 412, height: 860 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = context.pages()[0] ?? await context.newPage();
page.setDefaultTimeout(20000);
const problems = [];
page.on('pageerror', (error) => problems.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') problems.push(message.text().slice(0, 200)); });

const results = [];
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY, 'i') : null;
async function step(name, run) {
  if (ONLY && !ONLY.test(name)) return;
  try {
    await run();
    results.push(`  ok  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${String(error.message).split('\n').slice(0, 4).join('\n      ')}`);
    await shot(`fail-${results.length}`);
    if (process.env.APP_DEBUG) {
      const controls = await page.evaluate(() => [...document.querySelectorAll('flt-semantics[role], input, textarea')].map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute('role') ?? ''}] ${JSON.stringify((el.getAttribute('aria-label') ?? el.textContent ?? '').slice(0, 60))}`).join('\n        '));
      results.push(`      on screen:\n        ${controls}`);
    }
  }
  console.log(results.at(-1));
}
async function shot(name) {
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

// Flutter draws on a canvas; with semantics on, every control also appears as an accessible element.
const button = (name) => page.getByRole('button', { name, exact: false }).first();
const text = (value) => page.getByText(value, { exact: false }).first();
const tap = async (locator) => { await locator.waitFor({ state: 'visible' }); await locator.click(); };
async function typeIn(label, value) {
  const field = page.getByRole('textbox', { name: label, exact: false }).first();
  await field.waitFor();
  await field.click();
  await field.fill(value);
}
async function scrollTo(locator, tries = 25) {
  for (let i = 0; i < tries; i += 1) {
    if (await locator.isVisible().catch(() => false)) return;
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(250);
  }
  await locator.waitFor({ state: 'visible', timeout: 2000 });
}
const back = async () => { await page.getByRole('button', { name: 'Back' }).first().click(); await page.waitForTimeout(400); };
const tab = async (name) => { await page.getByRole('tab', { name }).first().click().catch(async () => { await page.getByRole('button', { name }).last().click(); }); await page.waitForTimeout(600); };

await page.goto(`http://localhost:${APP_PORT}/`);
await page.waitForTimeout(4000);


const receiptPath = path.join(dir, 'receipt.jpg');
await sharp({ create: { width: 500, height: 800, channels: 3, background: '#f0f0f0' } }).jpeg().toFile(receiptPath);
const photoPath = path.join(dir, 'photo.jpg');
await sharp({ create: { width: 800, height: 800, channels: 3, background: '#c08060' } }).jpeg().toFile(photoPath);
const nav = (name) => page.locator('flt-semantics[role="tab"], flt-semantics[role="button"]').filter({ hasText: new RegExp(`^${name}$`) }).last();
const goTab = async (name) => { await nav(name).click(); await page.waitForTimeout(900); };
const visible = async (value, timeout = 15000) => text(value).waitFor({ state: 'visible', timeout });
const pick = async (field, option, search) => {
  await scrollTo(button(field));
  await button(field).click();
  if (search) {
    await page.waitForTimeout(400);
    await page.keyboard.type(search);
  }
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: option, exact: false }).filter({ hasNotText: field }).first().click();
  await page.waitForTimeout(400);
};

if (process.env.DUMP_ALL) { const a = page.getByRole("textbox").first(); await a.click(); await a.fill(SITE); await page.getByRole("button", { name: "Connect" }).click(); await page.waitForTimeout(6000); console.log(await page.evaluate(() => [...document.querySelectorAll("flt-semantics")].slice(0, 45).map((el) => `${el.getAttribute("role") ?? "-"} | aria=${JSON.stringify(el.getAttribute("aria-label"))} | own=${JSON.stringify([...el.childNodes].filter((n) => n.nodeType === 3 || n.tagName === "SPAN").map((n) => n.textContent).join("").slice(0, 50))} | ${el.getBoundingClientRect().height.toFixed(0)}`).join("\n"))); process.exit(0); }
await step('first launch asks for the website address and connects to it', async () => {
  await shot('01-setup');
  const address = page.getByRole('textbox').first();
  await address.click();
  await address.fill(SITE);
  await page.waitForTimeout(300);
  await shot('02-setup-filled');
  await button('Connect').click();
  await visible('Find your life partner', 30000);
  await shot('03-home');
});

await step('the home page shows the website’s sections and featured proposals', async () => {
  await visible('Search rishtay');
  for (const heading of ['Featured proposals', 'From a first conversation', 'Join Our Official WhatsApp Channel', 'A personal approach.', 'A clear identity.', 'Your questions.', 'A little about your enquiry']) {
    await scrollTo(text(heading), 40);
    if (heading === 'Featured proposals') await shot('04-home-featured');
    if (heading === 'A personal approach.') await shot('05-home-reasons');
  }
  await shot('06-home-contact');
});

await step('Urdu changes the words but keeps the layout', async () => {
  await page.mouse.wheel(0, -40000);
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'اردو' }).first().click();
  await page.waitForTimeout(1500);
  await visible('رشتے');
  await shot('07-home-urdu');
  await page.getByRole('button', { name: 'English' }).first().click();
  await page.waitForTimeout(1500);
  await visible('Find your life partner');
});

await step('the home search opens matching proposals: brides only', async () => {
  await scrollTo(button('Search rishtay'));
  await button('Search rishtay').click();
  await visible('2 proposals found');
  await scrollTo(text(sana));
  assert.equal(await text('Bilal').isVisible().catch(() => false), false);
  await shot('08-proposals');
});

await step('filters: caste type-ahead narrows the list, and clearing restores it', async () => {
  await page.mouse.wheel(0, -40000);
  await button('Filters').click();
  await visible('Search and filter');
  await pick('Caste / Biradari', 'Rajput', 'Raj');
  await shot('09-filters');
  await button('Show results').click();
  await visible('1 proposal found');
  await scrollTo(text(hira));
  await page.mouse.wheel(0, -40000);
  await button('Clear filters').click();
  await visible('4 proposals found');
});

await step('region tabs: a category lists only its proposals', async () => {
  await page.getByRole('checkbox', { name: 'United Kingdom', exact: false }).or(page.getByRole('button', { name: 'United Kingdom' })).first().click().catch(async () => {
    await page.locator('flt-semantics').filter({ hasText: /^UK/ }).first().click();
  });
  await page.waitForTimeout(1500);
  await shot('10-region');
});

await step('a visitor reads a proposal: biodata sections, no contact details, sign in to chat', async () => {
  await goTab('Home');
  await goTab('Proposals');
  await page.mouse.wheel(0, -40000);
  await button('Clear filters').click().catch(() => {});
  await page.waitForTimeout(1200);
  const card = page.getByRole('button', { name: sana }).first();
  await scrollTo(card);
  await card.click();
  await visible('Candidate information');
  await visible('Sign in to chat');
  await shot('11-profile-visitor');
  await scrollTo(text('Partner requirements'), 40);
  await shot('12-profile-partner');
  await scrollTo(text('Share this biodata with your family.'), 40);
  await back();
});

await step('a member signs in and lands on the dashboard', async () => {
  await goTab('Account');
  await button('Sign in').click();
  await page.getByRole('textbox', { name: 'Email' }).first().fill(MEMBER.email);
  await page.getByRole('textbox').nth(1).fill(MEMBER.password);
  await page.getByRole('button', { name: 'Sign in' }).last().click();
  await visible('Welcome back, Bilal', 20000);
  await shot('13-dashboard');
  await scrollTo(text('Recommended matches'));
  await shot('14-dashboard-matches');
});

await step('members see locked contact details, save a proposal and find it under Saved', async () => {
  await goTab('Proposals');
  await page.waitForTimeout(1200);
  const card = page.getByRole('button', { name: sana }).first();
  await scrollTo(card);
  await card.click();
  await visible('Chat now');
  await button('Save profile').click();
  await visible('Saved');
  await scrollTo(text('Contact details'), 40);
  await visible('Locked');
  await shot('15-profile-member-locked');
  await back();
  await goTab('Saved');
  await visible(sana);
  await shot('16-saved');
  assert.equal(await db.savedProfile.count(), 1);
});

await step('chat: start a conversation from a proposal and send a message', async () => {
  await goTab('Proposals');
  const card = page.getByRole('button', { name: sana }).first();
  await scrollTo(card);
  await card.click();
  await button('Chat now').click();
  await visible('Say salaam to begin the conversation.');
  const box = page.getByRole('textbox').last();
  await box.click();
  await box.fill('Assalam-o-Alaikum from the app');
  await button('Send message').click();
  await visible('Assalam-o-Alaikum from the app');
  await shot('17-chat');
  assert.equal(await db.message.count(), 1);
  await back();
  await back();
  await goTab('Messages');
  await visible('Sana Tariq');
  await shot('18-messages');
});

await step('unlock popup leads to payment options; a payment with a receipt is submitted', async () => {
  await goTab('Proposals');
  const card = page.getByRole('button', { name: sana }).first();
  await scrollTo(card);
  await card.click();
  await scrollTo(button('Unlock Full Profile Access'), 40);
  await button('Unlock Full Profile Access').click();
  await visible('View original profile photographs.');
  await shot('19-unlock');
  await button('View Payment Options').click();
  await visible('Meezan Bank');
  await visible('PK36MEZN0001234567890123');
  await shot('20-payment-methods');
  await page.getByRole('textbox', { name: 'Sender name' }).fill('Bilal Ahmed');
  await page.getByRole('textbox', { name: 'Transaction ID' }).fill('TX-998877');
  await scrollTo(page.getByRole('textbox', { name: 'Amount paid' }));
  await page.getByRole('textbox', { name: 'Amount paid' }).fill('5000');
  const chooser = page.waitForEvent('filechooser');
  await scrollTo(button('Choose from gallery'));
  await button('Choose from gallery').click();
  await (await chooser).setFiles(receiptPath);
  await page.waitForTimeout(1500);
  await shot('21-payment-filled');
  await scrollTo(button('Submit payment'));
  await button('Submit payment').click();
  await page.waitForTimeout(2500);
  const request = await db.paymentRequest.findFirst();
  assert.equal(request?.transaction_id, 'TX-998877');
  assert.equal(request?.status, 'pending');
});

await step('payment status, history and unlocked access', async () => {
  await page.goto(`http://localhost:${APP_PORT}/`);
  await page.waitForTimeout(4000);
  await goTab('Account');
  await scrollTo(button('My Payment Status'), 40);
  await button('My Payment Status').click();
  await visible('Your payment is being reviewed');
  await visible('TX-998877');
  await shot('22-payment-status');
  await back();
});

await step('the member edits their profile through every step, and it goes back to review', async () => {
  await scrollTo(button('My matrimonial profile'), 40);
  await button('My matrimonial profile').click();
  await page.getByRole('button', { name: bilalProfile }).first().click();
  await visible('Approved and live');
  await shot('23-my-profile');
  await button('Edit profile').click();
  await visible('STEP 1 OF 7');
  await shot('24-edit-step1');
  for (let step = 2; step <= 7; step += 1) {
    await scrollTo(button('Continue'), 40);
    await button('Continue').click();
    await visible(`STEP ${step} OF 7`);
  }
  await shot('25-edit-documents');
  await scrollTo(button('Save changes'), 40);
  await button('Save changes').click();
  await visible('Waiting for review', 20000);
  const row = await db.profile.findUnique({ where: { id: Number(bilalProfile.slice(3)) } });
  assert.equal(row.status, 'pending');
  await db.profile.update({ where: { id: row.id }, data: { status: 'approved' } });
  await back();
  await back();
});

await step('partner preferences save through the website’s rules', async () => {
  await scrollTo(button('Partner preferences'), 40);
  await button('Partner preferences').click();
  await visible('Partner requirements');
  await page.getByRole('textbox', { name: 'Preferred age from' }).fill('24');
  await page.getByRole('textbox', { name: 'Preferred age to' }).fill('30');
  await scrollTo(button('Save partner requirements'), 40);
  await button('Save partner requirements').click();
  await visible('Saved. Our team will review the change before it goes live.');
  await shot('26-preferences');
  const row = await db.profile.findUnique({ where: { id: Number(bilalProfile.slice(3)) } });
  assert.equal(row.pref_age_max, 30);
  await db.profile.update({ where: { id: row.id }, data: { status: 'approved' } });
  await back();
});

await step('notifications list the payment and open its page', async () => {
  await scrollTo(button('Notifications'), 40);
  await button('Notifications').click();
  await visible('Payment received');
  await shot('27-notifications');
  await back();
});

await step('account settings save the member’s details', async () => {
  await scrollTo(button('Account settings'), 40);
  await button('Account settings').click();
  const name = page.getByRole('textbox', { name: 'Name' }).first();
  await name.fill('Bilal A. Ahmed');
  await button('Save details').click();
  await visible('Your details have been saved.');
  assert.equal((await db.user.findUnique({ where: { email: MEMBER.email } })).name, 'Bilal A. Ahmed');
  await back();
});

await step('signing out, then submitting a profile without an account', async () => {
  await scrollTo(button('Sign out'), 60);
  await button('Sign out').click();
  await visible('Register now');
  await page.evaluate((draft) => localStorage.setItem('flutter.profile_draft', JSON.stringify(draft)), JSON.stringify({
    full_name: 'Ayesha Malik', gender: 'female', date_of_birth: `${new Date().getFullYear() - 24}-04-04`, height_cm: '163', marital_status: 'Never married', mother_tongue: 'Urdu', caste: 'Awan', nationality: 'Pakistani', origin_country: 'Pakistan', origin_city: 'Multan', profile_created_by: 'Mother', description: 'Kind and educated.', contact_phone: '0300 5556667', contact_email: 'ayesha@test.local',
    education_level: 'Masters', occupation: 'Teacher', employment_status: 'Employed', religion: 'Islam', country_id: '1', city: 'Multan', partner_demand: 'A respectful family.',
  }));
  await page.goto(`http://localhost:${APP_PORT}/`);
  await page.waitForTimeout(4000);
  await goTab('Account');
  await button('Submit a profile').click();
  await visible('STEP 1 OF 7');
  await shot('28-submit-step1');
  for (let step = 2; step <= 7; step += 1) {
    await scrollTo(button('Continue'), 40);
    await button('Continue').click();
    await visible(`STEP ${step} OF 7`);
  }
  const chooser = page.waitForEvent('filechooser');
  await page.locator('flt-semantics[role="button"]').filter({ hasText: '' }).first();
  await scrollTo(text('Profile photographs'), 30);
  await page.getByRole('button').filter({ hasText: /^$/ }).first().click().catch(() => {});
  try { await (await Promise.race([chooser, new Promise((_, reject) => setTimeout(() => reject(new Error('no chooser')), 3000))])).setFiles(photoPath); } catch { /* the photo is optional */ }
  await page.waitForTimeout(800);
  await scrollTo(page.getByRole('checkbox', { name: 'I confirm', exact: false }), 40);
  await page.getByRole('checkbox', { name: 'I confirm', exact: false }).click();
  await shot('29-submit-documents');
  await scrollTo(button('Submit profile'), 40);
  await button('Submit profile').click();
  await visible('received', 25000);
  await shot('30-submitted');
  const row = await db.profile.findFirst({ where: { full_name: 'Ayesha Malik' } });
  assert.equal(row.status, 'pending');
  await button('View my profile').click();
  await visible('Waiting for review');
  await visible('Manage this profile from an account');
  await shot('31-private-link');
  await back();
});

await step('the private link is remembered on this phone', async () => {
  await goTab('Account');
  await button('Open the private link').click();
  await visible('Profiles submitted from this phone');
  await visible('Ayesha');
  await back();
});

await step('the contact form sends an enquiry to the bureau', async () => {
  await scrollTo(button('Contact us'), 30);
  await button('Contact us').click();
  await page.getByRole('textbox', { name: 'Enter your full name' }).fill('Parent Name');
  await page.getByRole('textbox', { name: '0300 1234567' }).fill('0300 1234567');
  await scrollTo(button('Send your enquiry'), 30);
  await button('Send your enquiry').click();
  await visible('Thank you. Your enquiry has been sent');
  assert.equal(await db.enquiry.count(), 1);
  await back();
});

await step('consultants, legal pages and settings open', async () => {
  await scrollTo(button('Marriage consultants'), 30);
  await button('Marriage consultants').click();
  await visible('Professional marriage consultants');
  await back();
  await scrollTo(button('Privacy policy'), 30);
  await button('Privacy policy').click();
  await visible('What we collect');
  await back();
  await nav('Account').click();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await visible('Connected website');
  await shot('32-settings');
  await back();
});

await step('tablet width shows proposals in a grid', async () => {
  await page.setViewportSize({ width: 900, height: 1100 });
  await goTab('Proposals');
  await page.waitForTimeout(1500);
  await shot('33-tablet-proposals');
  await page.setViewportSize({ width: 412, height: 860 });
});

await context.close();
web.close();
try { process.kill(-server.pid); } catch { /* stopped */ }
await closeDb();
const unique = [...new Set(problems)].filter((line) => !/Failed to load resource|404|401|403|422/.test(line));
if (unique.length) console.log(`\nApp errors (${unique.length}):\n${unique.slice(0, 8).join('\n')}`);
if (/error/i.test(serverLog)) console.log(`\nServer log:\n${serverLog.split('\n').filter((line) => /error/i.test(line)).slice(0, 8).join('\n')}`);
const failed = results.filter((line) => line.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed.`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
