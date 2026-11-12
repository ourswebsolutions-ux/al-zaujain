// End-to-end checks of the mobile app's API (/api/mobile/*) against a real server and a fresh test database.
// Run with: npm run test:mobile-api   (needs a fresh `npm run build`)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { prepareTestDatabase, sampleProfile } from '../helpers.mjs';

const PORT = 3213;
const BASE = `http://localhost:${PORT}`;
const API = `${BASE}/api/mobile`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'az-mobile-'));
const DATABASE_URL = await prepareTestDatabase();
const env = { ...process.env, DATABASE_URL, STORAGE_DIR: dir, APP_SECRET: crypto.randomBytes(32).toString('hex'), SITE_URL: BASE, CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2598' };
Object.assign(process.env, env);

const { closeDb, getDb } = await import('../../lib/db.js');
const { createProfile } = await import('../../lib/profiles.js');
const { profileCode } = await import('../../lib/format.js');
const { saveSettings } = await import('../../lib/settings.js');
const { hashPassword } = await import('../../lib/security.js');
const db = getDb();

const server = spawn('npx', ['next', 'start', '-p', String(PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let serverLog = '';
server.stdout.on('data', (data) => { serverLog += data; });
server.stderr.on('data', (data) => { serverLog += data; });
for (let attempt = 0; attempt < 60; attempt += 1) {
  try { if ((await fetch(`${API}/config`)).ok) break; } catch { /* still starting */ }
  await new Promise((resolve) => { setTimeout(resolve, 500); });
}

const results = [];
async function step(name, run) {
  try {
    await run();
    results.push(`  ok  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${String(error.stack ?? error.message).split('\n').slice(0, 5).join('\n      ')}`);
  }
  console.log(results.at(-1));
}

// The app sends JSON, or multipart for files, with its token as a Bearer header.
async function call(method, route, { token, json, form, headers = {} } = {}) {
  const response = await fetch(`${API}/${route}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(json ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json ? JSON.stringify(json) : form,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}
const get = (route, token) => call('GET', route, { token });
const post = (route, json, token) => call('POST', route, { json, token });
const imageBlob = async (color, width = 700, height = 700) => new Blob([await sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toBuffer()], { type: 'image/jpeg' });

const year = new Date().getFullYear();
const approved = async (overrides, extra = {}) => {
  const id = await createProfile(sampleProfile(overrides), { status: 'approved', ...extra });
  return { id, code: profileCode(id) };
};
const groomA = await approved({ full_name: 'Bilal Ahmed', gender: 'male', caste: 'Rajput', city: 'Lahore', height_cm: 180, nationality: 'British' });
const brideB = await approved({ full_name: 'Sana Tariq', gender: 'female', caste: 'Arain', city: 'Multan', height_cm: 160, contact_phone: '0300 7654321' });

let config;
await step('config: site, lists and the website’s own profile form, with no private settings', async () => {
  const { status, body } = await get('config');
  assert.equal(status, 200);
  config = body;
  assert.equal(body.app, 'al-zaujain');
  assert.equal(body.api, 1);
  assert.equal(body.form.length, 7);
  assert.ok(body.form[0].fields.some((field) => field.name === 'full_name' && field.required && field.private));
  assert.ok(body.form[0].fields.find((field) => field.name === 'gender').options.some((option) => option.value === 'female' && option.label === 'Female'));
  assert.ok(body.countries.some((country) => country.name === 'Pakistan'));
  assert.ok(body.cities.some((city) => city.name === 'Multan' && city.country === 'Pakistan'));
  assert.ok(body.castes.length > 10 && body.castes.some((caste) => caste.alt));
  assert.ok(body.categories.length >= 3);
  assert.ok(body.legal.privacy.length > 3 && body.legal.terms.length > 3);
  assert.equal(body.site.chat_enabled, true);
  const text = JSON.stringify(body);
  for (const secret of ['admin_notify_email', 'smtp', 'match_weights', 'APP_SECRET']) assert.ok(!text.includes(secret), `config must not include ${secret}`);
});

await step('i18n: the website’s Urdu dictionary and patterns', async () => {
  const { body } = await get('i18n');
  assert.ok(Object.keys(body.ur).length > 500);
  assert.equal(body.ur['Proposals'] !== undefined, true);
  for (const [source] of body.patterns) new RegExp(source);
});

await step('home and proposals return the same approved cards as the website, with every filter', async () => {
  const home = await get('home');
  assert.ok(home.body.profiles.some((card) => card.code === groomA.code));
  assert.ok(!JSON.stringify(home.body).includes('Ahmed'), 'only first names leave the server');
  const brides = await get('proposals?gender=female');
  assert.deepEqual(brides.body.profiles.map((card) => card.code), [brideB.code]);
  assert.equal((await get('proposals?caste=Rajput')).body.total, 1);
  assert.equal((await get('proposals?height_min=175')).body.profiles[0].code, groomA.code);
  assert.equal((await get('proposals?nationality=British')).body.total, 1);
  assert.equal((await get('proposals?q=Rajput')).body.total, 1);
  const pakistan = await get('proposals?path=pakistan');
  assert.equal(pakistan.status, 200);
  assert.ok(pakistan.body.tabs.length > 1 && pakistan.body.title.includes('Pakistan'));
  assert.equal((await get('proposals?path=pakistan/multan')).body.total, 1);
  assert.equal((await get('proposals?path=nowhere')).status, 404);
  const website = await (await fetch(`${BASE}/proposals?gender=female`)).text();
  assert.ok(website.includes(brideB.code), 'the website lists the same proposal');
});

let tokenA;
let tokenB;
await step('register and sign in return a token that works without cookies', async () => {
  const bad = await post('auth/register', { name: 'A', email: 'nope', phone: '1', password: 'x' });
  assert.equal(bad.status, 422);
  const reg = await post('auth/register', { name: 'Bilal Ahmed', email: 'bilal@test.local', phone: '0300 1112223', password: 'Bilal-pass-123' });
  assert.equal(reg.status, 200, JSON.stringify(reg.body));
  assert.ok(reg.body.token.length > 30);
  assert.equal(reg.body.user.email, 'bilal@test.local');
  tokenA = reg.body.token;
  await db.profile.update({ where: { id: groomA.id }, data: { user_id: reg.body.user.id } });
  const wrong = await post('auth/login', { email: 'bilal@test.local', password: 'wrong-password' });
  assert.equal(wrong.status, 422);
  assert.equal(wrong.body.message, 'Incorrect email or password.');
  const regB = await post('auth/register', { name: 'Sana Tariq', email: 'sana@test.local', phone: '0300 4445556', password: 'Sana-pass-1234' });
  tokenB = regB.body.token;
  await db.profile.update({ where: { id: brideB.id }, data: { user_id: regB.body.user.id } });
  const login = await post('auth/login', { email: 'SANA@test.local ', password: 'Sana-pass-1234' });
  assert.equal(login.status, 200);
  const me = await get('me', login.body.token);
  assert.equal(me.body.user.name, 'Sana Tariq');
  assert.equal((await get('me')).status, 401);
  const expired = await get('me', 'x'.repeat(43));
  assert.equal(expired.status, 401);
  assert.equal(expired.body.signedOut, true);
});

await step('a website cookie can never act through the mobile API', async () => {
  const response = await fetch(`${API}/saved`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `az_session=${tokenA}`, Origin: 'https://evil.example' }, body: JSON.stringify({ code: brideB.code, saved: true }) });
  assert.equal(response.status, 401);
  assert.equal(await db.savedProfile.count(), 0);
});

await step('profile detail follows the website’s locks: contact hidden from unpaid members', async () => {
  const anonymous = await get(`profiles/${brideB.code}`);
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.body.biodata.name, 'Sana');
  assert.deepEqual(anonymous.body.biodata.contact, []);
  assert.equal(anonymous.body.canSave, false);
  const member = await get(`profiles/${brideB.code}`, tokenA);
  assert.deepEqual(member.body.lockedContact, ['Phone', 'Email']);
  assert.equal(member.body.canSave, true);
  assert.equal(member.body.canChat, true);
  assert.equal(typeof member.body.yourScore, 'number');
  assert.ok(member.body.whatsapp.startsWith('https://wa.me/'));
  assert.ok(Array.isArray(member.body.compatible) && Array.isArray(member.body.similar));
  await db.memberAccess.create({ data: { user_id: (await db.user.findUnique({ where: { email: 'bilal@test.local' } })).id, active: true } });
  const paid = await get(`profiles/${brideB.code}`, tokenA);
  assert.equal(paid.body.biodata.name, 'Sana Tariq');
  assert.deepEqual(paid.body.biodata.contact.map((row) => row.value), ['0300 7654321', 'person@example.com']);
  assert.deepEqual(paid.body.lockedContact, []);
  await db.memberAccess.deleteMany();
  const views = await db.profileView.count({ where: { profile_id: brideB.id } });
  assert.ok(views >= 2, 'views are counted once a day per visitor');
  assert.equal((await get('profiles/AZ-99999')).status, 404);
});

await step('saving, the dashboard, matches, saved list and profile views', async () => {
  assert.equal((await post('saved', { code: brideB.code, saved: true }, tokenA)).body.saved, true);
  assert.equal((await post('saved', { code: groomA.code, saved: true }, tokenA)).status, 422, 'you cannot save your own profile');
  const saved = await get('saved', tokenA);
  assert.deepEqual(saved.body.profiles.map((card) => card.code), [brideB.code]);
  const dashboard = await get('dashboard', tokenA);
  assert.equal(dashboard.body.primary.code, groomA.code);
  assert.equal(dashboard.body.savedCount, 1);
  assert.ok(dashboard.body.primary.completion.percent > 0);
  const matches = await get('matches', tokenA);
  assert.ok(matches.body.matches.some((card) => card.code === brideB.code && typeof card.score === 'number'));
  await get(`profiles/${groomA.code}`, tokenB);
  const views = await get('views', tokenA);
  assert.equal(views.body.hasProfile, true);
  assert.ok(views.body.total >= 1);
  assert.equal(views.body.daily.length, 14);
});

let manageToken;
let submittedCode;
await step('a visitor submits a profile with photos and a CNIC, and manages it with the private link', async () => {
  const form = new FormData();
  const values = sampleProfile({ full_name: 'Ayesha Khan', date_of_birth: `${year - 25}-03-04`, contact_email: 'ayesha@test.local', caste: 'Awan', marriage_location: 'Overseas' });
  form.append('data', JSON.stringify({ ...values, height_cm: String(values.height_cm), country_id: String(values.country_id) }));
  form.append('photos', await imageBlob('#a05030'), 'one.jpg');
  form.append('photos', await imageBlob('#3050a0'), 'two.jpg');
  form.append('cnic_front', await imageBlob('#30a050', 900, 560), 'front.jpg');
  form.append('photo_public', 'yes');
  const missingConsent = await call('POST', 'profiles', { form });
  assert.equal(missingConsent.status, 422);
  assert.ok(missingConsent.body.errors.consent);
  form.append('consent', 'yes');
  const invalid = new FormData();
  invalid.append('data', JSON.stringify({ ...values, date_of_birth: `${year - 15}-01-01` }));
  invalid.append('consent', 'yes');
  const young = await call('POST', 'profiles', { form: invalid });
  assert.equal(young.status, 422);
  assert.ok(young.body.errors.date_of_birth);
  const { status, body } = await call('POST', 'profiles', { form });
  assert.equal(status, 200, JSON.stringify(body));
  submittedCode = body.code;
  manageToken = body.manageToken;
  assert.ok(manageToken);
  const row = await db.profile.findUnique({ where: { id: Number(submittedCode.replace(/\D/g, '')) }, include: { photos: true, cnic_document: true } });
  assert.equal(row.status, 'pending');
  assert.equal(row.photos.length, 2);
  assert.ok(row.cnic_document);
  assert.equal(row.marriage_location, 'Overseas');
  const manage = await get(`manage/${manageToken}`);
  assert.equal(manage.body.profile.code, submittedCode);
  assert.equal(manage.body.biodata.name, 'Ayesha Khan');
  assert.ok(manage.body.text.includes('AL ZAUJAIN'));
  assert.ok(manage.body.photos[0].thumb.includes(`?m=${manageToken}`));
  const photo = await fetch(`${BASE}${manage.body.photos[0].thumb}`);
  assert.equal(photo.status, 200, 'the private link opens the profile’s own photos');
  assert.equal((await fetch(`${BASE}${manage.body.photos[0].thumb.split('?')[0]}`)).status, 404, 'a pending profile’s photo is not public');
  assert.equal((await get('manage/not-a-real-token')).status, 404);
});

await step('the private link edits the profile, which goes back to review', async () => {
  const manage = await get(`manage/${manageToken}`);
  const form = new FormData();
  form.append('data', JSON.stringify({ ...manage.body.values, occupation: 'Doctor' }));
  form.append('manage_token', manageToken);
  form.append('remove_photo', String(manage.body.photos[1].id));
  form.append('photo_public', 'no');
  const { status, body } = await call('POST', `profiles/${submittedCode}`, { form });
  assert.equal(status, 200, JSON.stringify(body));
  assert.equal(body.reviewRequired, true);
  const row = await db.profile.findUnique({ where: { id: Number(submittedCode.replace(/\D/g, '')) }, include: { photos: true } });
  assert.equal(row.occupation, 'Doctor');
  assert.equal(row.photos.length, 1);
  assert.equal(row.photo_public, false);
  const stranger = new FormData();
  stranger.append('data', JSON.stringify(manage.body.values));
  assert.equal((await call('POST', `profiles/${submittedCode}`, { form: stranger, token: tokenB })).status, 403);
});

await step('registering with the private link adds the profile to the new account', async () => {
  const reg = await post('auth/register', { name: 'Ayesha Khan', email: 'ayesha@test.local', phone: '0300 9998887', password: 'Ayesha-pass-12', claim: manageToken });
  assert.equal(reg.status, 200);
  const mine = await get('my/profiles', reg.body.token);
  assert.deepEqual(mine.body.profiles.map((item) => item.code), [submittedCode]);
  const panel = await get(`my/profiles/${submittedCode}`, reg.body.token);
  assert.equal(panel.body.profile.status, 'pending');
  assert.equal(panel.body.values.occupation, 'Doctor');
  assert.equal((await get(`my/profiles/${brideB.code}`, reg.body.token)).status, 404);
  const own = await fetch(`${BASE}${panel.body.photos[0].thumb}`, { headers: { Authorization: `Bearer ${reg.body.token}` } });
  assert.equal(own.status, 200, 'the owner’s token opens their own photos');
  assert.equal((await post(`manage/${manageToken}/claim`, {}, tokenA)).body.claimed, false);
});

await step('restricted photos are blurred for unpaid viewers and sharp for the owner', async () => {
  const id = Number(submittedCode.replace(/\D/g, ''));
  await db.profile.update({ where: { id }, data: { status: 'approved', photo_public: true } });
  await saveSettings({ restrict_photo: '1' });
  const { body } = await get(`profiles/${submittedCode}`, tokenA);
  assert.equal(body.photoLocked, true);
  const file = `${BASE}${body.photos[0].file}`;
  const blurred = Buffer.from(await (await fetch(file, { headers: { Authorization: `Bearer ${tokenA}` } })).arrayBuffer());
  const ownerToken = (await post('auth/login', { email: 'ayesha@test.local', password: 'Ayesha-pass-12' })).body.token;
  const original = Buffer.from(await (await fetch(file, { headers: { Authorization: `Bearer ${ownerToken}` } })).arrayBuffer());
  assert.equal((await sharp(blurred).metadata()).width, 480);
  assert.ok((await sharp(original).metadata()).width > 480);
  await saveSettings({ restrict_photo: '0' });
});

await step('partner preferences save through the website’s rules', async () => {
  const prefs = await get('preferences', tokenA);
  assert.equal(prefs.body.code, groomA.code);
  const bad = await post('preferences', { code: groomA.code, values: { ...prefs.body.values, pref_age_min: 40, pref_age_max: 30 } }, tokenA);
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.pref_age_max);
  const ok = await post('preferences', { code: groomA.code, values: { ...prefs.body.values, partner_demand: 'Educated and kind.', pref_age_min: 22, pref_age_max: 30 } }, tokenA);
  assert.equal(ok.status, 200);
  const row = await db.profile.findUnique({ where: { id: groomA.id } });
  assert.equal(row.pref_age_max, 30);
  assert.equal(row.status, 'pending', 'the change goes back to review');
  await db.profile.update({ where: { id: groomA.id }, data: { status: 'approved' } });
});

await step('payments: methods, submitting a receipt, history and the receipt itself', async () => {
  await db.paymentMethod.create({ data: { name: 'Meezan Bank', account_holder: 'Al Zaujain', bank_name: 'Meezan', iban: 'PK00MEZN0000000000000000', active: true } });
  await saveSettings({ access_price: 'Rs 5,000' });
  const state = await get('payments', tokenA);
  assert.equal(state.body.state, 'none');
  assert.equal(state.body.price, 'Rs 5,000');
  assert.equal(state.body.methods[0].iban, 'PK00MEZN0000000000000000');
  assert.ok(state.body.access.some((item) => item.key === 'phone' && item.open === false));
  const form = new FormData();
  form.append('method_id', String(state.body.methods[0].id));
  form.append('sender_name', 'Bilal Ahmed');
  form.append('transaction_id', 'TX-12345');
  form.append('amount', '5,000');
  form.append('receipt', await imageBlob('#ffffff', 500, 800), 'receipt.jpg');
  const sent = await call('POST', 'payments', { form, token: tokenA });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const again = await call('POST', 'payments', { form, token: tokenA });
  assert.equal(again.status, 409);
  const after = await get('payments', tokenA);
  assert.equal(after.body.pending, true);
  assert.equal(after.body.requests[0].status, 'pending');
  const receipt = `${BASE}${after.body.requests[0].receipt}`;
  assert.equal((await fetch(receipt, { headers: { Authorization: `Bearer ${tokenA}` } })).status, 200);
  assert.notEqual((await fetch(receipt, { headers: { Authorization: `Bearer ${tokenB}` } })).status, 200);
});

let conversationId;
await step('chat: start from a proposal, send, read on the other side, block', async () => {
  const start = await post('chat/start', { code: brideB.code }, tokenA);
  assert.equal(start.status, 200, JSON.stringify(start.body));
  conversationId = start.body.conversationId;
  assert.equal((await post(`chat/${conversationId}`, { body: '  ' }, tokenA)).status, 400);
  const sent = await post(`chat/${conversationId}`, { body: 'Assalam-o-Alaikum' }, tokenA);
  assert.equal(sent.status, 200);
  const list = await get('conversations', tokenB);
  assert.equal(list.body.conversations[0].unread, 1);
  const thread = await get(`chat/${conversationId}`, tokenB);
  assert.equal(thread.body.otherName, 'Bilal Ahmed');
  assert.equal(thread.body.messages[0].body, 'Assalam-o-Alaikum');
  assert.equal((await get('conversations', tokenB)).body.conversations[0].unread, 0);
  const notes = await get('notifications', tokenB);
  assert.ok(notes.body.notifications.some((item) => item.title === 'New message from Bilal Ahmed'));
  await post('notifications/read', {}, tokenB);
  assert.equal((await get('me', tokenB)).body.unreadNotifications, 0);
  assert.equal((await post(`chat/${conversationId}/block`, { blocked: true }, tokenB)).body.blockedByMe, true);
  const blocked = await post(`chat/${conversationId}`, { body: 'Hello?' }, tokenA);
  assert.equal(blocked.status, 403);
  await post(`chat/${conversationId}/block`, { blocked: false }, tokenB);
  assert.equal((await get(`chat/${conversationId}`, (await post('auth/login', { email: 'ayesha@test.local', password: 'Ayesha-pass-12' })).body.token)).status, 404);
});

await step('account settings: details, email preferences, password change signs other devices out', async () => {
  const details = await post('me/details', { name: 'Bilal A.', phone: '0300 1112224' }, tokenA);
  assert.equal(details.body.user.name, 'Bilal A.');
  assert.equal((await post('me/details', { name: 'B', phone: 'abc' }, tokenA)).status, 422);
  const prefs = await post('me/notifications', { match_frequency: 'off', show_in_views: false }, tokenA);
  assert.equal(prefs.body.user.matchFrequency, 'off');
  assert.equal(prefs.body.user.showInViews, false);
  assert.equal((await post('me/password', { current: 'wrong', password: 'New-pass-12345' }, tokenA)).status, 422);
  const changed = await post('me/password', { current: 'Bilal-pass-123', password: 'New-pass-12345' }, tokenA);
  assert.equal(changed.status, 200);
  assert.equal((await get('me', tokenA)).status, 401, 'the old token stops working');
  tokenA = changed.body.token;
  assert.equal((await get('me', tokenA)).status, 200);
  assert.equal((await post('auth/logout', {}, tokenA)).status, 200);
  assert.equal((await get('me', tokenA)).status, 401);
});

await step('public forms: enquiry, password reset request, form step check, consultants, legal text', async () => {
  assert.equal((await post('enquiry', { name: 'A' })).status, 422);
  const enquiry = await post('enquiry', { name: 'Parent', phone: '0300 1234567', profile_for: 'My son', message: 'Please call.' });
  assert.equal(enquiry.status, 200);
  assert.equal(await db.enquiry.count(), 1);
  assert.equal((await post('auth/forgot', { email: 'sana@test.local' })).status, 200);
  const step1 = await post('form/validate', { section: 'personal', values: {} });
  assert.equal(step1.body.valid, false);
  assert.equal(step1.body.errors.full_name, 'Full name is required');
  assert.equal((await post('form/validate', { section: 'nope', values: {} })).status, 422);
  assert.equal((await get('consultants')).status, 200);
  assert.equal((await get('consultants/missing')).status, 404);
  assert.equal((await get('unknown/route')).status, 404);
  assert.equal((await call('DELETE', 'config')).status, 405);
});

await step('the owner deletes a profile from the app', async () => {
  const owner = (await post('auth/login', { email: 'ayesha@test.local', password: 'Ayesha-pass-12' })).body.token;
  assert.equal((await call('DELETE', `profiles/${submittedCode}`, { json: {}, token: tokenB })).status, 403);
  assert.equal((await call('DELETE', `profiles/${submittedCode}`, { json: {}, token: owner })).status, 200);
  assert.equal(await db.profile.count({ where: { id: Number(submittedCode.replace(/\D/g, '')) } }), 0);
});

await step('premium credits: buy a package, admin approves, unlock once, protected data only for the unlocker', async () => {
  const { approvePayment } = await import('../../lib/payments.js');
  await saveSettings({ restrict_photo: '1' });
  const pack = await db.creditPackage.create({ data: { name: 'Starter', credits: 5, price: '1000', featured: true } });
  const config = await get('config');
  assert.equal(config.body.credits.unlockCost, 1);
  assert.deepEqual(config.body.credits.packages.map((item) => [item.name, item.credits, item.price]), [['Starter', 5, 1000]]);
  assert.equal(config.body.fees.registration[0].fee, 'Rs. 5,000', 'the consultancy fees come separately');
  const buyer = (await post('auth/register', { name: 'Credit Buyer', email: 'credits@test.local', phone: '0300 1231234', password: 'Credit-pass-123' })).body.token;
  assert.equal((await get('me', buyer)).body.credits, 0);
  const methodId = (await db.paymentMethod.findFirst()).id;
  const form = new FormData();
  form.append('method_id', String(methodId));
  form.append('package_id', String(pack.id));
  form.append('sender_name', 'Credit Buyer');
  form.append('transaction_id', 'CREDIT-1');
  form.append('amount', '1000');
  form.append('receipt', await imageBlob('#eeeeee', 400, 600), 'receipt.jpg');
  const sent = await call('POST', 'payments', { form, token: buyer });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  let credits = (await get('credits', buyer)).body;
  assert.equal(credits.balance, 0, 'nothing is added from the app alone');
  assert.equal(credits.pending.credits, 5);
  await approvePayment(sent.body.id, (await db.user.findFirst({ where: { email: 'bilal@test.local' } })).id, 0, null);
  credits = (await get('credits', buyer)).body;
  assert.deepEqual([credits.balance, credits.purchased, credits.used], [5, 5, 0]);
  assert.equal(credits.purchases[0].status, 'approved');

  const paidId = await createProfile(sampleProfile({ full_name: 'Rabia Noor', gender: 'female', contact_phone: '0300 5554443' }), { status: 'approved' });
  const paidCode = profileCode(paidId);
  await db.profile.update({ where: { id: paidId }, data: { access_type: 'paid' } });
  const photoForm = new FormData();
  photoForm.append('data', JSON.stringify({ ...sampleProfile({ full_name: 'Rabia Noor', gender: 'female', contact_phone: '0300 5554443' }), height_cm: '165', country_id: '1' }));
  photoForm.append('photos', await imageBlob('#a05030'), 'p.jpg');
  const admin = await db.user.update({ where: { email: 'bilal@test.local' }, data: { role: 'admin' } });
  const adminToken = (await post('auth/login', { email: 'bilal@test.local', password: 'New-pass-12345' })).body.token;
  assert.equal((await call('POST', `profiles/${paidCode}`, { form: photoForm, token: adminToken })).status, 200);
  await db.profile.update({ where: { id: paidId }, data: { status: 'approved', photo_public: true } });
  await db.user.update({ where: { id: admin.id }, data: { role: 'user' } });

  const locked = (await get(`profiles/${paidCode}`, buyer)).body;
  assert.equal(locked.credits.canUnlock, true);
  assert.equal(locked.credits.balance, 5);
  assert.deepEqual(locked.biodata.contact, []);
  assert.equal(locked.biodata.name, 'Rabia');
  const photoUrl = `${BASE}${locked.photos[0].file}`;
  const blurred = Buffer.from(await (await fetch(photoUrl, { headers: { Authorization: `Bearer ${buyer}` } })).arrayBuffer());
  assert.equal((await sharp(blurred).metadata()).width, 480, 'the photo is blurred before unlocking');
  const viaCookie = await fetch(`${API}/profiles/${paidCode}/unlock`, { method: 'POST', headers: { Cookie: `az_session=${buyer}`, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(viaCookie.status, 401, 'a browser cookie cannot spend credits through the app API');

  const unlocked = await post(`profiles/${paidCode}/unlock`, {}, buyer);
  assert.equal(unlocked.status, 200, JSON.stringify(unlocked.body));
  assert.deepEqual([unlocked.body.charged, unlocked.body.balance], [1, 4]);
  const again = await post(`profiles/${paidCode}/unlock`, {}, buyer);
  assert.deepEqual([again.body.charged, again.body.balance], [0, 4], 'opening it again costs nothing');
  const open = (await get(`profiles/${paidCode}`, buyer)).body;
  assert.equal(open.credits.unlocked, true);
  assert.equal(open.biodata.name, 'Rabia Noor');
  assert.ok(open.biodata.contact.some((row) => row.value === '0300 5554443'));
  const sharp1 = Buffer.from(await (await fetch(photoUrl, { headers: { Authorization: `Bearer ${buyer}` } })).arrayBuffer());
  assert.ok((await sharp(sharp1).metadata()).width > 480, 'the unlocker gets the real photo');
  const other = (await post('auth/register', { name: 'Other Member', email: 'other@test.local', phone: '0300 9879879', password: 'Other-pass-1234' })).body.token;
  const otherView = (await get(`profiles/${paidCode}`, other)).body;
  assert.deepEqual(otherView.biodata.contact, [], 'unlocking is personal');
  assert.equal((await sharp(Buffer.from(await (await fetch(photoUrl, { headers: { Authorization: `Bearer ${other}` } })).arrayBuffer())).metadata()).width, 480);
  assert.equal((await sharp(Buffer.from(await (await fetch(photoUrl)).arrayBuffer())).metadata()).width, 480, 'and anonymous visitors only get the blur');
  const broke = await post(`profiles/${paidCode}/unlock`, {}, other);
  assert.equal(broke.status, 402);
  assert.equal(broke.body.insufficient, true);
  assert.equal((await post(`profiles/${paidCode}/unlock`, {})).status, 401);
  const me = (await get('me', buyer)).body;
  assert.equal(me.credits, 4);
  assert.deepEqual(me.unlocked, [paidCode], 'the website and the app read the same unlocks');
  const history = (await get('credits', buyer)).body.transactions.map((row) => `${row.kind}:${row.amount}:${row.balance}`);
  assert.deepEqual(history, ['unlock:-1:4', 'purchase:5:5']);
  await saveSettings({ restrict_photo: '0' });
});

await step('staff open the website panels inside the app with a one-minute link', async () => {
  const member = (await post('auth/login', { email: 'bilal@test.local', password: 'New-pass-12345' })).body.token;
  assert.equal((await post('staff/web-link', {}, member)).status, 403, 'members get no panel link');
  assert.equal((await get('admin/summary', member)).status, 403);
  assert.equal((await post('staff/web-link', {})).status, 401);

  await db.user.create({ data: { email: 'boss@test.local', password_hash: hashPassword('Boss-pass-12345'), name: 'Asif Raza', role: 'admin' } });
  const token = (await post('auth/login', { email: 'boss@test.local', password: 'Boss-pass-12345' })).body.token;
  const summary = (await get('admin/summary', token)).body;
  for (const key of ['pendingProfiles', 'payments', 'verification', 'enquiries', 'profiles', 'members']) assert.equal(typeof summary[key], 'number', key);

  const { url } = (await post('staff/web-link', { next: '/admin/payment-requests' }, token)).body;
  assert.match(url, /^\/app-login\?t=/);
  const opened = await fetch(`${BASE}${url}`, { redirect: 'manual' });
  assert.equal(opened.status, 303);
  assert.equal(opened.headers.get('location'), '/admin/payment-requests');
  const cookie = opened.headers.get('set-cookie')?.split(';')[0];
  assert.match(cookie ?? '', /^az_session=/);
  const panel = await fetch(`${BASE}/admin/payment-requests`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(panel.status, 200, 'the in-app browser is signed in to the admin panel');

  const tampered = url.replace(/t=(\d+)/, (match, id) => `t=${Number(id) + 1}`);
  assert.equal((await fetch(`${BASE}${tampered}`, { redirect: 'manual' })).headers.get('location'), '/login', 'a changed link is refused');
  const outside = (await post('staff/web-link', { next: '//evil.example/admin' }, token)).body.url;
  assert.equal(new URLSearchParams(outside.split('?')[1]).get('next'), '/admin', 'links only lead into the panel');
  const later = (await post('staff/web-link', {}, token)).body.url;
  await post('auth/logout', {}, token);
  assert.equal((await fetch(`${BASE}${later}`, { redirect: 'manual' })).headers.get('location'), '/login', 'signing out of the app voids unused links');
});

await step('the website pages that now share code still render', async () => {
  for (const url of ['/', '/proposals', '/proposals/pakistan', `/profile/${brideB.code}`, '/privacy', '/terms', '/consultants']) {
    const response = await fetch(`${BASE}${url}`);
    assert.equal(response.status, 200, url);
  }
  assert.ok((await (await fetch(`${BASE}/privacy`)).text()).includes('What we collect'));
});

try { process.kill(-server.pid); } catch { /* already stopped */ }
await closeDb();
if (/error/i.test(serverLog)) console.log(`\nServer log:\n${serverLog.split('\n').filter((line) => /error/i.test(line)).slice(0, 12).join('\n')}`);
const failed = results.filter((line) => line.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed.`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
