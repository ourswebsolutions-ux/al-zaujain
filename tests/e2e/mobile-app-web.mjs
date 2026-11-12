// Drives the real Flutter app (built for the web with AZ_SEMANTICS=true) against a real server and a
// fresh test database, the way a family would use it on a phone.
//   cd mobile-app && flutter build web --profile --dart-define=AZ_SEMANTICS=true --dart-define=AZ_SITE=http://localhost:3214
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
if (!fs.existsSync(path.join(WEB, 'main.dart.js'))) throw new Error('Build the web app first: cd mobile-app && flutter build web --profile --dart-define=AZ_SEMANTICS=true --dart-define=AZ_SITE=http://localhost:3214');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-app-'));
const DATABASE_URL = await prepareTestDatabase();
const env = { ...process.env, DATABASE_URL, STORAGE_DIR: dir, APP_SECRET: crypto.randomBytes(32).toString('hex'), SITE_URL: SITE, CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2597' };
Object.assign(process.env, env);
const { closeDb, getDb } = await import('../../lib/db.js');
const { hashPassword } = await import('../../lib/security.js');
const { saveSettings } = await import('../../lib/settings.js');
const db = getDb();

const server = spawn('npx', ['next', 'start', '-p', String(API_PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
// The server always stops with the test, even after a crash.
process.on('exit', () => { try { process.kill(-server.pid); } catch { /* already stopped */ } });
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
  const id = Number(code.replace(/\D/g, ''));
  await db.profile.update({ where: { id }, data: { status: 'approved', approved_at: new Date(), ...extra } });
  return code;
}
const sana = await seedProfile({ full_name: 'Sana Tariq', gender: 'female', caste: 'Arain', city: 'Multan', date_of_birth: `${year - 26}-02-02`, contact_phone: '0300 7654321', headline_ur: 'ثنا طارق', partner_demand: 'تعلیم یافتہ اور نیک رشتہ درکار ہے۔' }, '#b06070', { verification_status: 'verified', featured: true });
const hira = await seedProfile({ full_name: 'Hira Khan', gender: 'female', caste: 'Rajput', city: 'Lahore', date_of_birth: `${year - 29}-05-05`, occupation: 'Doctor' }, '#6070b0');
const bilalProfile = await seedProfile({ full_name: 'Bilal Ahmed', gender: 'male', caste: 'Jutt', city: 'Lahore', date_of_birth: `${year - 30}-03-03`, contact_email: 'bilal@test.local' }, '#50a070');
await seedProfile({ full_name: 'Usman Ali', gender: 'male', caste: 'Awan', city: 'London', country_id: (await db.country.findFirst({ where: { name: 'United Kingdom' } }))?.id ?? 1, nationality: 'British' }, '#a09050', { access_type: 'premium' });
const MEMBER = { email: 'bilal@test.local', password: 'Bilal-pass-123' };
const bilal = await db.user.create({ data: { email: MEMBER.email, password_hash: hashPassword(MEMBER.password), name: 'Bilal Ahmed', phone: '0300 1112223' } });
await db.profile.update({ where: { id: Number(bilalProfile.replace(/\D/g, '')) }, data: { user_id: bilal.id } });
const sanaUser = await db.user.create({ data: { email: 'sana@test.local', password_hash: hashPassword('Sana-pass-1234'), name: 'Sana Tariq' } });
await db.profile.update({ where: { id: Number(sana.replace(/\D/g, '')) }, data: { user_id: sanaUser.id } });
await db.paymentMethod.create({ data: { name: 'Meezan Bank', account_holder: 'Al Zaujain', bank_name: 'Meezan Bank Ltd', iban: 'PK36MEZN0001234567890123', active: true } });
await saveSettings({ access_price: 'Rs 5,000', announcements: 'New proposals every week\nOverseas rishtay from UK, USA and Gulf' });
const starter = await db.creditPackage.create({ data: { name: 'Starter', credits: 5, price: '1000', description: 'Try premium profiles.', featured: true } });

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
    console.log(results.at(-1));
    await shot(`fail-${results.length}`);
    if (process.env.APP_DEBUG) {
      const controls = await page.evaluate(() => [...document.querySelectorAll('flt-semantics[role], input, textarea')].map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute('role') ?? ''}] ${JSON.stringify((el.getAttribute('aria-label') ?? el.textContent ?? '').slice(0, 60))}`).join('\n        '));
      console.log(`      on screen:\n        ${controls}`);
    }
    return;
  }
  console.log(results.at(-1));
}
async function shot(name) {
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

// Flutter draws on a canvas; with semantics on, every control also appears as an accessible element.
const button = (name) => page.getByRole('button', { name, exact: false }).first();
// Plain text appears either as an element's text or as its accessibility label; the deepest match wins.
// The app shows English in Title Case ("1 Proposal Found"), so the match ignores capitals.
const text = (value) => page.locator(`flt-semantics[aria-label*=${JSON.stringify(value)} i], flt-semantics:has-text(${JSON.stringify(value)})`).last();
const tap = async (locator) => { await locator.waitFor({ state: 'visible' }); await locator.click(); };
// Only the focused field is a real input in a Flutter web page: tap it, then type like a person.
async function typeIn(label, value) {
  const field = page.getByRole('textbox', { name: label, exact: false }).first();
  await scrollTo(field);
  await field.click();
  await page.waitForTimeout(250);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.waitForTimeout(150);
}
async function scrollTo(locator, tries = 25) {
  const size = page.viewportSize();
  await page.mouse.move(size.width / 2, size.height / 2);
  for (let i = 0; i < tries; i += 1) {
    if (await locator.isVisible().catch(() => false)) return;
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(250);
  }
  await locator.waitFor({ state: 'visible', timeout: 2000 });
}
const back = async () => { await page.getByRole('button', { name: 'Back' }).first().click(); await page.waitForTimeout(400); };
const tab = async (name) => { await page.getByRole('tab', { name }).first().click().catch(async () => { await page.getByRole('button', { name }).last().click(); }); await page.waitForTimeout(600); };

// The WhatsApp Channel welcome is tested on its own below; every other step starts with it answered.
await context.addInitScript(() => { if (!localStorage.getItem('az_test_welcome')) { localStorage.setItem('flutter.channel_welcome', '"joined"'); } });
await page.goto(`http://localhost:${APP_PORT}/`);
await page.waitForTimeout(4000);


const receiptPath = path.join(dir, 'receipt.jpg');
await sharp({ create: { width: 500, height: 800, channels: 3, background: '#f0f0f0' } }).jpeg().toFile(receiptPath);
const photoPath = path.join(dir, 'photo.jpg');
await sharp({ create: { width: 800, height: 800, channels: 3, background: '#c08060' } }).jpeg().toFile(photoPath);
// A badge count joins the tab's name ("Account 1"), so match the word itself.
const nav = (name) => page.getByRole('tab', { name: new RegExp(`\\b${name}\\b`) });
const goTab = async (name) => { await nav(name).click(); await page.waitForTimeout(900); };
// Each step starts from a freshly opened app; the phone keeps the website and the session.
const fresh = async (tabName = 'Home') => {
  await page.goto(`http://localhost:${APP_PORT}/`);
  await nav('Home').waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  if (tabName !== 'Home') await goTab(tabName);
};
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

const SEARCH = 'Search name, ID, city or caste';
await step('the app opens straight to the home page, never asking for a website address', async () => {
  await visible('Tap To Switch', 30000);
  await page.getByRole('textbox', { name: SEARCH }).first().waitFor();
  await button('Open navigation').waitFor();
  assert.equal(await page.getByRole('textbox', { name: 'https://example.com' }).count(), 0);
  assert.equal(await button('Connect').count(), 0);
  await shot('03-home');
});

await step('the home page shows the website’s sections and featured proposals', async () => {
  // The website's order: proposal sections with their tabs and cards, then Director, Consultants, Government Registered.
  for (const heading of [sana, 'View Profile', 'Overseas', 'Gulf', 'Second Marriage', 'Director', 'Government Registered Marriage Bureau']) {
    await scrollTo(text(heading), 60);
    if (heading === 'View Profile') await shot('04-home-cards');
    if (heading === 'Director') await shot('05-home-director');
  }
  await shot('06-home-registered');
});

await step('Urdu turns the app right to left', async () => {
  await page.mouse.move(200, 430); await page.mouse.wheel(0, -40000);
  await page.waitForTimeout(800);
  await button('Open navigation').click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'اردو' }).first().click();
  await page.waitForTimeout(1500);
  await visible('رشتے');
  await shot('07-home-urdu');
  const homeTab = await page.getByRole('tab', { name: /ہوم/ }).boundingBox();
  assert.ok(homeTab.x > page.viewportSize().width / 2, 'in Urdu the app runs right to left: Home sits on the right');
  await button('مینو کھولیں').click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'English' }).first().click();
  await page.waitForTimeout(1500);
  await visible('Tap To Switch');
});

await step('the home search opens matching proposals: a city', async () => {
  await page.mouse.move(200, 430); await page.mouse.wheel(0, -40000);
  await typeIn(SEARCH, 'Multan');
  await page.keyboard.press('Enter');
  await visible('1 proposal found');
  await scrollTo(text(sana));
  assert.equal(await text('Bilal').isVisible().catch(() => false), false);
  await shot('08-proposals');
});

await step('filters: caste type-ahead narrows the list, and clearing restores it', async () => {
  await fresh('Search');
  await button('Filters').click();
  await visible('Search and filter');
  await pick('Caste / Biradari', 'Rajput', 'Raj');
  await shot('09-filters');
  await button('Show results').click();
  await visible('1 proposal found');
  await scrollTo(text(hira));
  await page.mouse.move(200, 430); await page.mouse.wheel(0, -40000);
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

await step('a guest browses proposals but needs an account to open one', async () => {
  await fresh('Search');
  const card = text(sana);
  await scrollTo(card);
  await card.click();
  await visible('Create a free account to view this proposal');
  assert.equal(await text('Candidate information').count(), 0, 'the proposal stays closed for guests');
  await shot('11-guest-account-needed');
  await button('Sign in').click();
  await visible('Welcome back');
  await back();
});

await step('a member signs in and lands on the dashboard', async () => {
  await fresh('Profile');
  await button('Sign in').click();
  const email = page.getByRole('textbox', { name: 'Email' }).first();
  await email.click();
  await email.fill(MEMBER.email);
  await page.keyboard.press('Tab');
  await page.keyboard.type(MEMBER.password);
  await page.getByRole('button', { name: 'Sign in' }).last().click();
  await visible('Welcome back, Bilal', 20000);
  await shot('13-dashboard');
  await scrollTo(text('Recommended matches'));
  await shot('14-dashboard-matches');
});

await step('members see locked contact details, save a proposal and find it under Saved', async () => {
  await fresh('Search');
  const card = text(sana);
  await scrollTo(card);
  await card.click();
  await visible('Chat now');
  await button('Save profile').click();
  await visible('Saved');
  await scrollTo(text('Contact details'), 40);
  await visible('Locked');
  await shot('15-profile-member-locked');
  await back();
  await goTab('Profile');
  await scrollTo(button('Saved profiles'), 40);
  await button('Saved profiles').click();
  await visible(sana);
  await shot('16-saved');
  assert.equal(await db.savedProfile.count(), 1);
});

await step('chat: start a conversation from a proposal and send a message', async () => {
  await fresh('Search');
  const card = text(sana);
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
  await fresh('Search');
  const card = text(sana);
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
  await typeIn('Sender name', 'Bilal Ahmed');
  await typeIn('Transaction ID', 'TX-998877');
  await typeIn('Amount paid', '5000');
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
  await fresh('Profile');
  await scrollTo(button('My Payment Status'), 40);
  await button('My Payment Status').click();
  await visible('Your payment is being reviewed');
  await visible('TX-998877');
  await shot('22-payment-status');
  await back();
});

await step('the member edits their profile through every step, and it goes back to review', async () => {
  await fresh('Profile');
  await scrollTo(button('My matrimonial profile'), 40);
  await button('My matrimonial profile').click();
  await text(bilalProfile).click();
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
  const row = await db.profile.findUnique({ where: { id: Number(bilalProfile.replace(/\D/g, '')) } });
  assert.equal(row.status, 'pending');
  await db.profile.update({ where: { id: row.id }, data: { status: 'approved' } });
  await back();
  await back();
});

await step('partner preferences save through the website’s rules', async () => {
  await fresh('Profile');
  await scrollTo(button('Partner preferences'), 40);
  await button('Partner preferences').click();
  await visible('Describe who you are looking for');
  await typeIn('Preferred age from', '24');
  await typeIn('Preferred age to', '30');
  await scrollTo(button('Save partner requirements'), 40);
  await button('Save partner requirements').click();
  let row;
  for (let i = 0; i < 30 && row?.pref_age_max !== 30; i += 1) {
    await page.waitForTimeout(500);
    row = await db.profile.findUnique({ where: { id: Number(bilalProfile.replace(/\D/g, '')) } });
  }
  assert.equal(row.pref_age_max, 30);
  await visible('Our team will review the change', 8000);
  await shot('26-preferences');
  await db.profile.update({ where: { id: row.id }, data: { status: 'approved' } });
  await back();
});

await step('notifications list the payment and open its page', async () => {
  await fresh('Profile');
  await scrollTo(button('Notifications'), 40);
  await button('Notifications').click();
  await visible('Payment received');
  await shot('27-notifications');
  await back();
});

await step('account settings save the member’s details', async () => {
  await fresh('Profile');
  await scrollTo(button('Account settings'), 40);
  await button('Account settings').click();
  await typeIn('Name', 'Bilal A. Ahmed');
  await button('Save details').click();
  await visible('Your details have been saved.');
  assert.equal((await db.user.findUnique({ where: { email: MEMBER.email } })).name, 'Bilal A. Ahmed');
  await back();
});

await step('a new family creates an account, then submits a profile with a photo', async () => {
  await fresh('Profile');
  await scrollTo(button('Sign out'), 60);
  await button('Sign out').click();
  await visible('Register now');
  await page.evaluate((draft) => localStorage.setItem('flutter.profile_draft', JSON.stringify(draft)), JSON.stringify({
    full_name: 'Ayesha Malik', gender: 'female', date_of_birth: `${new Date().getFullYear() - 24}-04-04`, height_cm: '163', marital_status: 'Never married', mother_tongue: 'Urdu', caste: 'Awan', nationality: 'Pakistani', origin_country: 'Pakistan', origin_city: 'Multan', profile_created_by: 'Mother', description: 'Kind and educated.', contact_phone: '0300 5556667', contact_email: 'ayesha@test.local',
    education_level: 'Masters', occupation: 'Teacher', employment_status: 'Employed', religion: 'Islam', country_id: '1', city: 'Multan', partner_demand: 'A respectful family.',
  }));
  await fresh('Profile');
  await button('Submit a profile').click();
  await visible('Create a free account to submit a profile');
  await button('Create an account').click();
  await typeIn('Your name', 'Ayesha Malik');
  await typeIn('Email', 'ayesha@test.local');
  await typeIn('Phone / WhatsApp', '0300 5556667');
  await scrollTo(button('Create my account'));
  await button('Create my account').click();
  await visible('STEP 1 OF 7', 20000);
  await shot('28-submit-step1');
  for (let step = 2; step <= 7; step += 1) {
    await scrollTo(button('Continue'), 40);
    await button('Continue').click();
    await visible(`STEP ${step} OF 7`);
  }
  await scrollTo(button('Add photos'), 30);
  const chooser = page.waitForEvent('filechooser');
  await button('Add photos').click();
  await (await chooser).setFiles(photoPath);
  await page.waitForTimeout(800);
  // Like a WhatsApp DP: the family places the face in the circle for the proposal cards.
  await visible('Adjust card photo');
  await button('Use this photo').click({ force: true });
  await page.waitForTimeout(800);
  await scrollTo(page.getByRole('checkbox', { name: 'I confirm', exact: false }), 40);
  await page.getByRole('checkbox', { name: 'I confirm', exact: false }).click();
  await shot('29-submit-documents');
  await scrollTo(button('Submit profile'), 40);
  await button('Submit profile').click();
  await visible('received', 25000);
  await shot('30-submitted');
  const row = await db.profile.findFirst({ where: { full_name: 'Ayesha Malik' }, include: { user: true, photos: true } });
  assert.equal(row.status, 'pending');
  assert.equal(row.user?.email, 'ayesha@test.local', 'the profile belongs to the new account');
  assert.equal(row.photos.length, 1);
  await button('View my profile').click();
  await visible('Waiting for review');
  await shot('31-my-new-profile');
  await back();
});

await step('the new member finds the profile under My matrimonial profile', async () => {
  await fresh('Profile');
  await scrollTo(button('My matrimonial profile'), 40);
  await button('My matrimonial profile').click();
  await visible('Ayesha');
  await back();
});

await step('a member unlocks a Premium profile with credits, once', async () => {
  const { adjustCredits } = await import('../../lib/credits.js');
  const bilalUser = await db.user.findUnique({ where: { email: MEMBER.email } });
  await adjustCredits(bilalUser.id, 3, 'Test credits', bilalUser.id);
  await db.profile.update({ where: { id: Number(hira.replace(/\D/g, '')) }, data: { access_type: 'paid' } });
  await page.evaluate(() => localStorage.removeItem('flutter.profile_draft'));
  await fresh('Profile');
  // The previous steps left another family signed in; switch to the member with credits.
  if (!(await button('Register now').count())) {
    await scrollTo(button('Sign out'), 60);
    await button('Sign out').click();
    await visible('Register now');
  }
  {
    await button('Sign in').click();
    const email = page.getByRole('textbox', { name: 'Email' }).first();
    await email.click();
    await email.fill(MEMBER.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(MEMBER.password);
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await visible('Welcome back, Bilal', 20000);
  }
  await fresh('Search');
  const card = text(hira);
  await scrollTo(card);
  await card.click();
  await scrollTo(button('Unlock profile'), 40);
  await shot('34-unlock-panel');
  await button('Unlock profile').click();
  await visible('Unlocked with your credits', 20000);
  const user = await db.user.findUnique({ where: { email: MEMBER.email } });
  assert.equal(user.credits, 2, 'exactly one credit was spent');
  assert.equal(await db.profileUnlock.count({ where: { user_id: user.id } }), 1);
  await scrollTo(text('0300 1234567'), 40);
  await shot('35-unlocked-contact');
  await back();
  await card.click();
  await visible('Unlocked with your credits', 20000);
  assert.equal((await db.user.findUnique({ where: { email: MEMBER.email } })).credits, 2, 'opening it again is free');
  await back();
});

await step('a member buys a credit package from the app; credits wait for approval', async () => {
  await fresh('Profile');
  await scrollTo(button('Buy Premium Credits'), 40);
  await button('Buy Premium Credits').click();
  await visible('Most popular');
  await shot('36-packages');
  await button('Choose Starter').click();
  await visible('Starter');
  await typeIn('Sender name', 'Bilal Ahmed');
  await typeIn('Transaction ID', 'CREDIT-APP-1');
  const chooser = page.waitForEvent('filechooser');
  await scrollTo(button('Choose from gallery'));
  await button('Choose from gallery').click();
  await (await chooser).setFiles(receiptPath);
  await page.waitForTimeout(1200);
  await scrollTo(button('Submit payment'));
  await button('Submit payment').click();
  await page.waitForTimeout(2500);
  const request = await db.paymentRequest.findFirst({ where: { transaction_id: 'CREDIT-APP-1' } });
  assert.equal(request?.package_id, starter.id);
  assert.equal(request?.credits, 5);
  assert.equal((await db.user.findUnique({ where: { email: MEMBER.email } })).credits, 2, 'no credits before approval');
  await fresh('Profile');
  await scrollTo(button('Premium Credits'), 40);
  await button('Premium Credits').click();
  await visible('is waiting for review');
  await shot('37-credits');
});

await step('the packages open from the menu, with Personalized Matchmaking', async () => {
  await fresh('Profile');
  await scrollTo(button('Packages'), 40);
  await button('Packages').click();
  await visible('Rishta Packages');
  await scrollTo(text('Personalized Matchmaking'), 60);
  await shot('38-packages');
});
await step('the contact form sends an enquiry to the bureau', async () => {
  await fresh('Profile');
  await scrollTo(button('Contact us'), 30);
  await button('Contact us').click();
  await typeIn('Enter your full name', 'Parent Name');
  await typeIn('0300 1234567', '0300 1234567');
  await scrollTo(button('Send your enquiry'), 30);
  await button('Send your enquiry').click();
  await visible('Thank you. Your enquiry has been sent');
  assert.equal(await db.enquiry.count(), 1);
  await back();
});

await step('consultants, legal pages and settings open', async () => {
  await fresh('Profile');
  await scrollTo(button('Marriage consultants'), 30);
  await button('Marriage consultants').click();
  await visible('Hire Personal Matchmaking Consultant');
  await back();
  await scrollTo(button('Privacy policy'), 30);
  await button('Privacy policy').click();
  await visible('What we collect');
  await back();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await visible('App version');
  // The connected website can be changed in Settings; on the built-in one there is nothing to reset.
  await visible('Connected website');
  await button('Change website').waitFor();
  assert.equal(await button('Use the default website').count(), 0, 'already on the default website');
  await shot('32-settings');
  await back();
});

await step('the WhatsApp Channel welcome shows every time the app opens, and "Maybe later" closes it', async () => {
  await page.evaluate(() => { localStorage.setItem('az_test_welcome', '1'); localStorage.removeItem('flutter.channel_welcome'); localStorage.removeItem('flutter.channel_welcome_at'); });
  await fresh();
  await button('Join WhatsApp Channel').waitFor({ timeout: 15000 });
  await shot('25-channel-welcome');
  await button('Maybe later').click();
  await page.waitForTimeout(800);
  await page.waitForTimeout(800);
  assert.equal(await button('Maybe later').isVisible().catch(() => false), false, '"Maybe later" closes it');
  await fresh();
  await button('Join WhatsApp Channel').waitFor({ timeout: 15000 });
  await button('Maybe later').click();
});

await step('tablet width shows proposals in a grid', async () => {
  await page.setViewportSize({ width: 900, height: 1100 });
  await fresh('Search');
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
