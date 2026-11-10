import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prepareTestDatabase, sampleProfile, useTempStorage } from './helpers.mjs';

const dir = useTempStorage();
await prepareTestDatabase();
const { getDb, closeDb } = await import('../lib/db.js');
const { ageFromDob, heightLabel, idFromCode, profileCode } = await import('../lib/format.js');
const { biodata, biodataToText, profileCompletion, profileSections, validateProfile, validateStep } = await import('../lib/profile-schema.js');
const { attachCnic, CARD_SELECT, createProfile, deleteProfile, getProfile, setVerification, toCard, updateProfile } = await import('../lib/profiles.js');
const { fulltextQuery, parseFilters, searchProfiles, searchWords } = await import('../lib/search.js');
const { compatibleProfiles, getWeights, matchScore, runMatchEmails, similarProfiles } = await import('../lib/matching.js');
const security = await import('../lib/security.js');
const uploads = await import('../lib/uploads.js');
const chat = await import('../lib/chat.js');
const engagement = await import('../lib/engagement.js');
const notifications = await import('../lib/notifications.js');
const { saveSettings } = await import('../lib/settings.js');
const payments = await import('../lib/payments.js');
const { contactFor, getRestrictions, hasPaidAccess, restrictionsFrom, viewerIsPaid } = await import('../lib/restrictions.js');
const { INBOX_LOCKED } = await import('../lib/access-text.js');

const approved = (overrides) => createProfile(sampleProfile(overrides), { status: 'approved' });
const db = getDb();
const makeUser = (data) => db.user.create({ data: { password_hash: 'x', name: 'N', ...data } });
const load = (id) => db.user.findUnique({ where: { id } });

after(() => closeDb());

describe('format helpers', () => {
  it('codes round-trip and reject junk', () => {
    assert.equal(profileCode(7), 'AZ-07');
    assert.equal(idFromCode('AZ-120'), 120);
    assert.equal(idFromCode("AZ-1' OR 1=1"), null);
  });
  it('age respects the birthday', () => {
    assert.equal(ageFromDob('2000-06-15', new Date('2026-06-14T00:00:00Z')), 25);
    assert.equal(ageFromDob('2000-06-15', new Date('2026-06-15T00:00:00Z')), 26);
  });
  it('height label', () => assert.equal(heightLabel(165), `5'5"`));
});

describe('profile validation', () => {
  it('accepts a complete profile', () => assert.equal(validateProfile(sampleProfile()).ok, true));
  it('rejects under-18s', () => {
    const result = validateProfile(sampleProfile({ date_of_birth: `${new Date().getFullYear() - 16}-01-01` }));
    assert.match(result.errors.date_of_birth, /at least 18/);
  });
  it('reports blank required fields with their own message', () => {
    const result = validateProfile(sampleProfile({ caste: '' }));
    assert.equal(result.errors.caste, 'Caste / Biradari is required');
  });
  it('rejects values outside the option list', () => {
    assert.ok(validateProfile(sampleProfile({ religion: 'Nonsense' })).errors.religion);
  });
  it('rejects an inverted preferred age range', () => {
    assert.ok(validateProfile(sampleProfile({ pref_age_min: 35, pref_age_max: 25 })).errors.pref_age_max);
  });
  it('validates one step at a time', () => {
    const errors = validateStep('education', { ...sampleProfile(), education_level: '' });
    assert.deepEqual(Object.keys(errors), ['education_level']);
  });
});

describe('privacy of public output', () => {
  it('public sections exclude every private field', async () => {
    const id = await approved({ full_name: 'Secret Surname', contact_email: 'hidden@example.com', current_residence: 'House 9' });
    const rows = profileSections(await getProfile(id), { publicOnly: true }).flatMap((section) => section.rows.map((row) => row.name));
    for (const name of ['full_name', 'date_of_birth', 'contact_phone', 'contact_email', 'contact_whatsapp', 'current_residence', 'permanent_residence', 'monthly_income']) assert.ok(!rows.includes(name), name);
  });
  it('cards carry only public fields', async () => {
    const id = await approved({ full_name: 'Secret Surname' });
    const row = await db.profile.findUnique({ where: { id }, select: CARD_SELECT });
    assert.deepEqual(Object.keys(toCard(row)).sort(), ['age', 'city', 'code', 'country', 'education', 'maritalStatus', 'name', 'photo', 'profession', 'type', 'verified']);
    assert.equal(toCard(row).name, 'Secret');
  });
  it('search cannot find a surname or phone number', async () => {
    await approved({ full_name: 'Findme Hiddensurname', contact_phone: '0311 9998887' });
    assert.equal((await searchProfiles(parseFilters({ q: 'Hiddensurname' }))).total, 0);
    assert.equal((await searchProfiles(parseFilters({ q: '9998887' }))).total, 0);
    assert.equal((await searchProfiles(parseFilters({ q: 'Findme' }))).total, 1);
  });
  it('public biodata excludes every private value', async () => {
    const id = await approved({ full_name: 'Sadia Secretsurname', contact_phone: '0311 5554443', contact_email: 'private@example.com', current_residence: 'Secret House', permanent_residence: 'Hidden Villa' });
    const text = biodataToText(biodata(await getProfile(id), 'AZ-99'));
    for (const secret of ['Secretsurname', '0311 5554443', 'private@example.com', 'Secret House', 'Hidden Villa']) assert.ok(!text.includes(secret), secret);
    assert.match(text, /Name: Sadia \(AZ-99\)/);
  });
  it('the owner copy includes private details', async () => {
    const id = await approved({ full_name: 'Sadia Secretsurname', contact_phone: '0311 5554443' });
    const text = biodataToText(biodata(await getProfile(id), 'AZ-99', { publicOnly: false }));
    assert.match(text, /Secretsurname/);
    assert.match(text, /Phone: 0311 5554443/);
  });
});

describe('biodata layout', () => {
  it('follows the traditional format and keeps the demand separate', async () => {
    const demand = 'لڑکی تعلیم یافتہ ہو۔ باقی تفصیلات پرسنل۔';
    const id = await approved({ headline_ur: 'عبیدالرحمٰن', marital_status: 'Divorced', children_details: 'No kids', monthly_income: '80K', caste: 'Arain', city: 'Patoki', residence_area: 'Village', home_ownership: 'Own', father_status: 'Alive', mother_status: 'Alive', brothers: 1, sisters: 5, partner_demand: demand, pref_age_max: 21 });
    const data = biodata(await getProfile(id), 'AZ-14');
    const value = (rows, label) => rows.find((row) => row.label === label)?.value;
    assert.equal(data.headline, 'عبیدالرحمٰن');
    assert.equal(value(data.candidate, 'Marital status'), 'Divorced (No kids)');
    assert.equal(value(data.candidate, 'Income'), '80K');
    assert.equal(value(data.candidate, 'Maslak'), 'Sunni');
    assert.equal(value(data.residence, 'City'), 'Patoki (Village)');
    assert.equal(value(data.residence, 'Home'), 'Own');
    assert.equal(value(data.family, 'Father'), 'Alive');
    assert.equal(value(data.family, 'Sisters'), 5);
    assert.equal(data.partner.demand, demand);
    assert.ok(!JSON.stringify([data.candidate, data.residence, data.family]).includes(demand), 'demand never mixes with candidate details');
    const text = biodataToText(data);
    assert.ok(text.indexOf('CANDIDATE INFORMATION') < text.indexOf('RESIDENCE'));
    assert.ok(text.indexOf('FAMILY DETAILS') < text.indexOf('PARTNER REQUIREMENTS'));
  });
  it('keeps very long Urdu demands intact', async () => {
    const demand = 'رشتہ '.repeat(800).trim();
    assert.equal(validateProfile(sampleProfile({ partner_demand: demand })).ok, true);
    const id = await approved({ partner_demand: demand });
    assert.equal((await getProfile(id)).partner_demand, demand);
  });
  it('requires a partner demand', () => {
    assert.ok(validateProfile(sampleProfile({ partner_demand: '' })).errors.partner_demand);
  });
  it('completion rises as details are added', async () => {
    const profile = await getProfile(await approved());
    const before = profileCompletion(profile, { photos: 0, hasCnic: false });
    const after = profileCompletion(profile, { photos: 1, hasCnic: true });
    assert.ok(after.percent > before.percent);
    assert.ok(before.missing.some((item) => item.label === 'Profile photograph'));
    assert.ok(!after.missing.some((item) => item.label === 'Profile photograph'));
  });
});

describe('saved profiles', () => {
  it('saves once, unsaves, and hides proposals that go offline', async () => {
    const user = (await makeUser({ email: 'saver@example.com' })).id;
    const id = await approved({ full_name: 'Saved Person' });
    await engagement.setSaved(user, id, true);
    await engagement.setSaved(user, id, true);
    assert.equal((await engagement.savedProfiles(user)).length, 1);
    await db.profile.update({ where: { id }, data: { status: 'pending' } });
    assert.equal((await engagement.savedProfiles(user)).length, 0);
    await db.profile.update({ where: { id }, data: { status: 'approved' } });
    await engagement.setSaved(user, id, false);
    assert.equal(await engagement.isSaved(user, id), false);
  });
});

describe('profile views', () => {
  const member = (id) => ({ id, role: 'user' });
  it('counts a visitor once a day and never the owner or staff', async () => {
    const owner = (await makeUser({ email: 'owner@example.com' })).id;
    const viewer = (await makeUser({ email: 'viewer@example.com' })).id;
    const id = await approved();
    await db.profile.update({ where: { id }, data: { user_id: owner } });
    const profile = await getProfile(id);
    await engagement.recordProfileView(profile, member(viewer), '1.1.1.1');
    await engagement.recordProfileView(profile, member(viewer), '1.1.1.1');
    await engagement.recordProfileView(profile, member(owner), '1.1.1.1');
    await engagement.recordProfileView(profile, { id: 999, role: 'admin' }, '1.1.1.1');
    await engagement.recordProfileView(profile, null, '2.2.2.2');
    await engagement.recordProfileView(profile, null, '2.2.2.2');
    await engagement.recordProfileView(profile, null, '3.3.3.3');
    assert.equal((await getProfile(id)).views, 3);
    const stats = await engagement.viewStats([id]);
    assert.equal(stats.total, 3);
    assert.equal(stats.lastWeek, 3);
    assert.equal(stats.daily.length, 14);
    assert.equal(stats.daily.at(-1).count, 3);
  });
  it('stores no raw IP address', async () => {
    const id = await approved();
    await engagement.recordProfileView(await getProfile(id), null, '9.8.7.6');
    const row = await db.profileView.findFirst({ where: { profile_id: id } });
    assert.ok(!row.viewer_key.includes('9.8.7.6'));
  });
  it('names a viewer only if they allow it', async () => {
    const shy = (await makeUser({ email: 'shy@example.com', show_in_views: false })).id;
    const open = (await makeUser({ email: 'open@example.com' })).id;
    await db.profile.update({ where: { id: await approved({ full_name: 'Shy Viewer' }) }, data: { user_id: shy } });
    await db.profile.update({ where: { id: await approved({ full_name: 'Open Viewer' }) }, data: { user_id: open } });
    const id = await approved();
    const profile = await getProfile(id);
    await engagement.recordProfileView(profile, member(shy), 'x');
    await engagement.recordProfileView(profile, member(open), 'x');
    const list = await engagement.recentViewers([id]);
    assert.equal(list.find((item) => item.card)?.card.name, 'Open');
    assert.equal(list.filter((item) => !item.card).length, 1);
  });
});

describe('notifications', () => {
  it('groups unread messages and tracks read state per user', async () => {
    const user = (await makeUser({ email: 'alerts@example.com' })).id;
    const other = (await makeUser({ email: 'alerts2@example.com' })).id;
    await notifications.notify(user, { type: 'message', title: 'One', groupKey: 'c1' });
    await notifications.notify(user, { type: 'message', title: 'Two', groupKey: 'c1' });
    await notifications.notify(user, { type: 'profile', title: 'Approved' });
    assert.equal(await notifications.unreadNotifications(user), 2);
    assert.ok((await notifications.listNotifications(user)).some((item) => item.title === 'Two'));
    const [first] = await notifications.listNotifications(user);
    await notifications.markRead(other, first.id);
    assert.equal(await notifications.unreadNotifications(user), 2, 'another user cannot mark it read');
    await notifications.markAllRead(user);
    assert.equal(await notifications.unreadNotifications(user), 0);
    await notifications.notify(user, { type: 'message', title: 'Three', groupKey: 'c1' });
    assert.equal(await notifications.unreadNotifications(user), 1, 'a new message after reading alerts again');
  });
  it('ignores profiles with no account', async () => {
    await notifications.notify(null, { type: 'profile', title: 'Nobody' });
  });
});

describe('international search and locations', () => {
  const has = async (params, code) => (await searchProfiles(parseFilters(params), {}, 500)).profiles.some((card) => card.code === code);
  it('filters by country, city, caste, height and nationality together', async () => {
    const canada = await db.country.findUnique({ where: { name: 'Canada' } });
    const id = await approved({ full_name: 'Intl Toronto', country_id: canada.id, city: 'Toronto', caste: 'Arain', height_cm: 178, nationality: 'Canadian', gender: 'male' });
    const code = profileCode(id);
    assert.ok(await has({ country: 'Canada', city: 'Toronto', caste: 'Arain', height_min: '175', height_max: '183', nationality: 'Canadian' }, code));
    assert.ok(!(await has({ country: 'Canada', height_min: '180' }, code)), 'shorter than the minimum');
    assert.ok(!(await has({ country: 'Canada', height_max: '170' }, code)), 'taller than the maximum');
    assert.ok(!(await has({ country: 'Australia' }, code)));
    assert.ok(!(await has({ nationality: 'British' }, code)));
    assert.ok(await has({ city: 'overseas' }, code), 'counts as overseas');
  });
  it('ignores heights outside the real range', () => {
    const filters = parseFilters({ height_min: '20', height_max: 'tall' });
    assert.equal(filters.heightMin, undefined);
    assert.equal(filters.heightMax, undefined);
  });
  it('saves, shows and searches the preferred marriage location', async () => {
    const id = await approved({ full_name: 'Settle Abroad', marriage_location: 'Zzsettleplace' });
    const profile = await getProfile(id);
    assert.equal(profile.marriage_location, 'Zzsettleplace');
    assert.ok(biodata(profile, profileCode(id)).residence.some((row) => row.label === 'Preferred marriage location' && row.value === 'Zzsettleplace'));
    assert.equal((await searchProfiles(parseFilters({ q: 'Zzsettleplace' }))).total, 1);
  });
  it('starts with a managed caste list, popular castes first, with Urdu names', async () => {
    const { casteOptions, nationalityOptions } = await import('../lib/places.js');
    const castes = await casteOptions();
    assert.ok(castes.length >= 40);
    assert.equal(castes[0].popular, true);
    assert.equal(castes.find((caste) => caste.value === 'Jutt').alt, 'جٹ');
    await db.caste.update({ where: { name: 'Gill' }, data: { active: false } });
    assert.ok(!(await casteOptions()).some((caste) => caste.value === 'Gill'), 'hidden castes leave the list');
    await db.caste.update({ where: { name: 'Gill' }, data: { active: true } });
    const nationalities = await nationalityOptions();
    assert.equal(nationalities[0], 'Pakistani');
    assert.ok(nationalities.includes('Canadian'));
  });
  it('places Canada and Australia in a category of their own and offers cities by country', async () => {
    const { citiesWithCountry } = await import('../lib/places.js');
    const category = await db.category.findUnique({ where: { slug: 'other-countries' }, include: { countries: true } });
    assert.deepEqual(category.countries.map((country) => country.name).sort(), ['Australia', 'Canada', 'Malaysia', 'New Zealand', 'Turkey']);
    const cities = await citiesWithCountry();
    assert.ok(cities.some((city) => city.name === 'Sahiwal' && city.country === 'Pakistan'));
    assert.ok(cities.some((city) => city.name === 'Toronto' && city.country === 'Canada'));
  });
});

describe('Urdu text', () => {
  it('stores and returns Urdu unchanged', async () => {
    const id = await approved({ description: 'مناسب رشتے کی تلاش' });
    assert.equal((await getProfile(id)).description, 'مناسب رشتے کی تلاش');
  });
});

describe('search', () => {
  it('finds Jutt by keyword and only approved ones', async () => {
    const live = await approved({ caste: 'Jutt', full_name: 'Keyword One', gender: 'male' });
    const hidden = await createProfile(sampleProfile({ caste: 'Jutt', full_name: 'Keyword Pending' }));
    const codes = (await searchProfiles(parseFilters({ q: 'jutt' }), {}, 100)).profiles.map((card) => card.code);
    assert.ok(codes.includes(profileCode(live)));
    assert.ok(!codes.includes(profileCode(hidden)));
  });
  it('matches the start of a word and combines words', async () => {
    await approved({ full_name: 'Combo Person', caste: 'Rajputana', city: 'Quetta' });
    assert.equal((await searchProfiles(parseFilters({ q: 'rajput' }))).total, 1);
    assert.equal((await searchProfiles(parseFilters({ q: 'rajput quetta' }))).total, 1);
    assert.equal((await searchProfiles(parseFilters({ q: 'rajput lahore' }))).total, 0);
  });
  it('still finds words too short for the full-text index', async () => {
    await approved({ full_name: 'Qx Shortname', caste: 'Zzshortcaste' });
    assert.equal((await searchProfiles(parseFilters({ q: 'Qx' }))).total, 1);
    assert.equal((await searchProfiles(parseFilters({ q: 'Qx Zzshortcaste' }))).total, 1);
    assert.equal((await searchProfiles(parseFilters({ q: 'Xq Zzshortcaste' }))).total, 0);
  });
  it('removes rejected profiles', async () => {
    const id = await approved({ full_name: 'Gonenow Person' });
    await db.profile.update({ where: { id }, data: { status: 'rejected' } });
    assert.equal((await searchProfiles(parseFilters({ q: 'Gonenow' }))).total, 0);
  });
  it('keeps search in step with edits and deletes', async () => {
    const id = await approved({ caste: 'Zzoldcaste' });
    await updateProfile(id, sampleProfile({ caste: 'Zznewcaste' }), { reviewRequired: false });
    assert.equal((await searchProfiles(parseFilters({ q: 'Zzoldcaste' }))).total, 0);
    assert.equal((await searchProfiles(parseFilters({ q: 'Zznewcaste' }))).total, 1);
    await deleteProfile(id);
    assert.equal((await searchProfiles(parseFilters({ q: 'Zznewcaste' }))).total, 0);
  });
  it('filters by age, gender, marital status and sect', async () => {
    const id = await approved({ full_name: 'Agecheck One', date_of_birth: `${new Date().getFullYear() - 41}-01-01`, marital_status: 'Widowed', sect: 'Shia' });
    const code = profileCode(id);
    const has = async (params) => (await searchProfiles(parseFilters(params), {}, 200)).profiles.some((card) => card.code === code);
    assert.ok(await has({ age: '36-45' }));
    assert.ok(!(await has({ age: '18-25' })));
    assert.ok(await has({ marital: 'Widowed', sect: 'Shia', gender: 'female' }));
    assert.ok(!(await has({ gender: 'male' })));
  });
  it('treats search and SQL syntax as plain text', async () => {
    for (const q of ['"', "'; DROP TABLE profiles;--", 'AND OR NOT', 'a*b(', 'caste:x', '%', '+-><()~*', '@@@']) {
      await searchProfiles(parseFilters({ q }));
      await searchProfiles(parseFilters({ caste: q, profession: q }));
    }
    assert.ok((await db.profile.count()) > 0);
    assert.equal(fulltextQuery(searchWords('"jutt" +lahore*')), '+jutt* +lahore*');
  });
  it('paginates', async () => {
    for (let index = 0; index < 5; index += 1) await approved({ caste: 'Pagecaste' });
    const page = await searchProfiles(parseFilters({ q: 'Pagecaste', page: '2' }), {}, 2);
    assert.equal(page.total, 5);
    assert.equal(page.pages, 3);
    assert.equal(page.profiles.length, 2);
  });
  it('scopes to a category', async () => {
    const uk = await db.country.findUnique({ where: { name: 'United Kingdom' } });
    await approved({ country_id: uk.id, city: 'London', caste: 'Scopecaste' });
    assert.equal((await searchProfiles(parseFilters({ q: 'Scopecaste' }), { categoryId: uk.category_id })).total, 1);
    assert.equal((await searchProfiles(parseFilters({ q: 'Scopecaste' }), { categoryId: uk.category_id + 1 })).total, 0);
  });
});

describe('verification rules', () => {
  it('cannot verify without a CNIC', async () => {
    const id = await approved();
    await assert.rejects(setVerification(id, 'verified', null, null), /no CNIC/);
    assert.equal((await getProfile(id)).verification_status, 'not_submitted');
  });
  it('a submitted CNIC is pending until reviewed', async () => {
    const id = await approved();
    await attachCnic(id, 'a.enc', null);
    assert.equal((await getProfile(id)).verification_status, 'pending');
    await setVerification(id, 'verified', null, null);
    assert.equal((await getProfile(id)).verification_status, 'verified');
    await attachCnic(id, 'b.enc', null);
    assert.equal((await getProfile(id)).verification_status, 'pending', 'a new document restarts review');
  });
});

describe('uploads and encryption', () => {
  const jpegWithExif = () => sharp({ create: { width: 900, height: 700, channels: 3, background: '#884422' } }).withExif({ IFD0: { Copyright: 'SECRET-EXIF-MARKER' } }).jpeg().toBuffer();
  const asFile = (buffer, name = 'x.jpg', type = 'image/jpeg') => new File([buffer], name, { type });

  it('CNIC files are unreadable on disk and decrypt correctly', async () => {
    const name = await uploads.saveCnic(asFile(await jpegWithExif()), 'CNIC');
    const raw = fs.readFileSync(path.join(dir, 'private', 'cnic', name));
    assert.ok(!raw.subarray(0, 12).toString('latin1').includes('RIFF'));
    assert.equal((await sharp(uploads.readCnic(name)).metadata()).format, 'webp');
  });
  it('a tampered CNIC file fails to decrypt', async () => {
    const name = await uploads.saveCnic(asFile(await jpegWithExif()), 'CNIC');
    const target = path.join(dir, 'private', 'cnic', name);
    const raw = fs.readFileSync(target);
    raw[raw.length - 1] ^= 0xff;
    fs.writeFileSync(target, raw);
    assert.throws(() => uploads.readCnic(name));
  });
  it('photos lose their EXIF data', async () => {
    const { file } = await uploads.savePhoto(asFile(await jpegWithExif()));
    const saved = fs.readFileSync(path.join(dir, 'uploads', 'photos', file));
    assert.ok(!saved.toString('latin1').includes('SECRET-EXIF-MARKER'));
  });
  it('rejects a non-image with an image name', async () => {
    await assert.rejects(uploads.savePhoto(asFile(Buffer.from('<?php echo 1; ?>'), 'shell.jpg')), /not a valid image/);
  });
  it('rejects oversized files', async () => {
    await assert.rejects(uploads.savePhoto(asFile(Buffer.alloc(9 * 1024 * 1024))), /larger than 8 MB/);
  });
  it('rejects SVG', async () => {
    await assert.rejects(uploads.savePhoto(asFile(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'a.svg', 'image/svg+xml')), /JPG, PNG or WebP|not a valid/);
  });
});

describe('security helpers', () => {
  it('hashes and verifies passwords', () => {
    const hash = security.hashPassword('correct horse');
    assert.ok(security.verifyPassword('correct horse', hash));
    assert.ok(!security.verifyPassword('wrong', hash));
    assert.ok(!security.verifyPassword('x', 'garbage'));
  });
  it('rate limiter stops at the limit', async () => {
    assert.ok(await security.rateLimit('t', 2, 60));
    assert.ok(await security.rateLimit('t', 2, 60));
    assert.ok(!(await security.rateLimit('t', 2, 60)));
  });
  it('rate limiter holds under concurrent requests', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => security.rateLimit('burst', 5, 60)));
    assert.equal(results.filter(Boolean).length, 5);
  });
  it('rate limiter window resets', async () => {
    assert.ok(await security.rateLimit('short', 1, 60));
    await db.rateLimit.updateMany({ data: { reset_at: 1 } });
    assert.ok(await security.rateLimit('short', 1, 60));
  });
  it('signatures reject tampering', () => {
    const signature = security.signValue('unsubscribe:1');
    assert.ok(security.verifySignature('unsubscribe:1', signature));
    assert.ok(!security.verifySignature('unsubscribe:2', signature));
  });
});

describe('matching', () => {
  it('scores a strong pair above a weak pair', async () => {
    const weights = await getWeights();
    const a = { ...sampleProfile({ gender: 'female' }), country_name: 'Pakistan', pref_age_min: 25, pref_age_max: 35, pref_caste: 'Jutt' };
    const good = { ...sampleProfile({ gender: 'male', caste: 'Jutt' }), country_name: 'Pakistan' };
    const weak = { ...sampleProfile({ gender: 'male', caste: 'Other', city: 'Oslo', religion: 'Hinduism', date_of_birth: '1950-01-01', education_level: 'Matric' }), country_name: 'Norway' };
    assert.ok(matchScore(a, good, weights) > matchScore(a, weak, weights) + 30);
    const score = matchScore(a, good, weights);
    assert.ok(score >= 0 && score <= 100);
  });
  it('compatible profiles are the opposite gender, approved and never self', async () => {
    const me = await getProfile(await approved({ gender: 'female' }));
    await approved({ gender: 'male' });
    const pending = await createProfile(sampleProfile({ gender: 'male' }));
    const list = await compatibleProfiles(me, 50);
    assert.ok(list.length > 0);
    assert.ok(list.every((card) => card.code !== profileCode(me.id) && card.code !== profileCode(pending)));
    for (const card of list) assert.equal((await getProfile(idFromCode(card.code))).gender, 'male');
    for (const card of await similarProfiles(me, 5)) assert.equal((await getProfile(idFromCode(card.code))).gender, 'female');
  });
  it('match results expose public fields only', async () => {
    const me = await getProfile(await approved({ gender: 'female' }));
    const [card] = await compatibleProfiles(me, 1);
    assert.deepEqual(Object.keys(card).sort(), ['age', 'city', 'code', 'country', 'education', 'maritalStatus', 'name', 'photo', 'profession', 'score', 'type', 'verified']);
  });

  it('emails each match once and retries after a failure', async () => {
    const user = (await makeUser({ email: 'm@example.com' })).id;
    const id = await approved({ gender: 'female', caste: 'Jutt' });
    await db.profile.update({ where: { id }, data: { user_id: user } });
    await saveSettings({ match_min_score: '1', match_max_per_email: '100' });
    const sent = [];
    let failing = true;
    const send = async (target, data) => {
      if (target.id !== user) return 'sent';
      if (failing) return 'failed';
      sent.push(data);
      return 'sent';
    };
    await runMatchEmails({ send, baseUrl: 'http://x', force: true });
    assert.equal(await db.matchNotification.count({ where: { user_id: user } }), 0, 'a failed send records nothing');
    failing = false;
    await runMatchEmails({ send, baseUrl: 'http://x', force: true });
    assert.equal(sent.length, 1);
    assert.ok((await db.matchNotification.count({ where: { user_id: user } })) > 0);
    await runMatchEmails({ send, baseUrl: 'http://x', force: true });
    assert.equal(sent.length, 1, 'no duplicate email when nothing new');
    const newcomer = await approved({ gender: 'male', full_name: 'Newcomer Person' });
    await runMatchEmails({ send, baseUrl: 'http://x', force: true });
    assert.equal(sent.length, 2);
    assert.match(sent[1].matches, new RegExp(profileCode(newcomer)));
    assert.equal(sent[1].count, 1, 'only the new proposal is sent');
  });

  it('respects the opt-out', async () => {
    const optedOut = (await makeUser({ email: 'o@example.com', match_emails: false })).id;
    await db.profile.update({ where: { id: await approved({ gender: 'female' }) }, data: { user_id: optedOut } });
    const contacted = [];
    await runMatchEmails({ send: async (target) => { contacted.push(target.id); return 'sent'; }, baseUrl: 'http://x', force: true });
    assert.ok(!contacted.includes(optedOut));
  });
});

describe('chat rules', () => {
  let a; let b;
  before(async () => {
    a = (await makeUser({ email: 'chat-a@example.com' })).id;
    b = (await makeUser({ email: 'chat-b@example.com' })).id;
    await saveSettings({ chat_enabled: '1', chat_require_approved: '1' });
  });
  it('needs an approved profile', async () => {
    assert.match(await chat.chatBlockReason(await load(a), b), /approved profile/);
    await db.profile.update({ where: { id: await approved() }, data: { user_id: a } });
    assert.equal(await chat.chatBlockReason(await load(a), b), null);
  });
  it('global switch stops everyone, including admins', async () => {
    await saveSettings({ chat_enabled: '0' });
    assert.match(await chat.chatBlockReason(await load(a), b), /switched off/);
    await saveSettings({ chat_enabled: '1' });
  });
  it('user-level restriction works both ways', async () => {
    await db.user.update({ where: { id: a }, data: { chat_disabled: true } });
    assert.match(await chat.chatBlockReason(await load(a), b), /restricted/);
    await db.user.update({ where: { id: a }, data: { chat_disabled: false } });
    await db.user.update({ where: { id: b }, data: { chat_disabled: true } });
    assert.match(await chat.chatBlockReason(await load(a), b), /cannot receive/);
    await db.user.update({ where: { id: b }, data: { chat_disabled: false } });
  });
  it('blocking stops both directions', async () => {
    await chat.setBlocked(b, a, true);
    assert.ok(await chat.chatBlockReason(await load(a), b));
    await chat.setBlocked(b, a, false);
    assert.equal(await chat.chatBlockReason(await load(a), b), null);
  });
  it('tracks unread and history', async () => {
    const conversation = await chat.openConversation(a, b);
    assert.equal(await chat.openConversation(b, a), conversation, 'the same pair shares one conversation');
    await chat.postMessage(conversation, a, 'Salaam');
    assert.equal(await chat.unreadCount(b), 1);
    assert.equal(await chat.unreadCount(a), 0);
    const [listed] = await chat.listConversations(b);
    assert.equal(listed.unread, 1);
    assert.equal(listed.preview, 'Salaam');
    assert.equal((await chat.fetchMessages(conversation, b)).length, 1);
    assert.equal(await chat.unreadCount(b), 0);
    assert.equal(await chat.conversationFor(conversation, 999999), null);
  });
  it('a consultant can only reach assigned clients', async () => {
    const consultantUser = (await makeUser({ email: 'c@example.com', role: 'consultant' })).id;
    const consultant = await db.consultant.create({ data: { user_id: consultantUser, slug: 'c', display_name: 'C' } });
    assert.match(await chat.chatBlockReason(await load(consultantUser), b), /assigned clients/);
    await db.profile.update({ where: { id: await approved() }, data: { user_id: b, consultant_id: consultant.id } });
    assert.equal(await chat.chatBlockReason(await load(consultantUser), b), null);
    await db.consultant.update({ where: { id: consultant.id }, data: { perm_chat: false } });
    assert.ok(await chat.chatBlockReason(await load(consultantUser), b));
  });
});

describe('payments and premium access', () => {
  let admin; let member; let method;
  const receipt = async () => {
    const bytes = await sharp({ create: { width: 300, height: 300, channels: 3, background: '#335577' } }).jpeg().toBuffer();
    return new File([bytes], 'receipt.jpg', { type: 'image/jpeg' });
  };
  const paymentForm = async (fields = {}) => {
    const form = new FormData();
    const values = { method_id: method, sender_name: 'Sender', transaction_id: `TX${Math.random()}`, amount: '5000', ...fields };
    for (const [key, value] of Object.entries(values)) form.set(key, String(value));
    form.set('receipt', await receipt());
    return form;
  };
  const freshMember = async () => (await makeUser({ email: `pay${Math.random()}@example.com` }));

  before(async () => {
    admin = (await makeUser({ email: 'payadmin@example.com', role: 'admin' })).id;
    member = await freshMember();
    method = (await db.paymentMethod.create({ data: { name: 'Bank', account_holder: 'Al Zaujain', bank_name: 'Meezan', iban: 'PK00' } })).id;
  });

  it('keeps today\'s behaviour until an admin changes a switch', () => {
    assert.deepEqual(restrictionsFrom({}), { photo: false, phone: true, email: true, whatsapp: true, inbox: false, other: false });
    assert.equal(restrictionsFrom({ restrict_photo: '1', restrict_phone: '0' }).photo, true);
    assert.equal(restrictionsFrom({ restrict_photo: '1', restrict_phone: '0' }).phone, false);
  });

  it('a submitted payment never unlocks anything by itself', async () => {
    const result = await payments.submitPayment(await paymentForm({ status: 'approved', active: '1' }), member);
    assert.equal(result.ok, true);
    const row = await db.paymentRequest.findUnique({ where: { id: result.id } });
    assert.equal(row.status, 'pending');
    assert.equal(await hasPaidAccess(member.id), false);
    const encrypted = fs.readFileSync(path.join(dir, 'private', 'receipts', row.receipt_file));
    assert.notEqual(encrypted.subarray(0, 2).toString('hex'), 'ffd8', 'receipts are encrypted on disk');
  });

  it('refuses a second request, a repeated transaction ID and an inactive method', async () => {
    assert.equal((await payments.submitPayment(await paymentForm(), member)).ok, false);
    const other = await freshMember();
    const taken = (await db.paymentRequest.findFirst({ where: { user_id: member.id } })).transaction_id;
    assert.equal((await payments.submitPayment(await paymentForm({ transaction_id: taken }), other)).ok, false);
    const off = await db.paymentMethod.create({ data: { name: 'Off', account_holder: 'A', bank_name: 'B', iban: 'X', active: false } });
    assert.equal((await payments.submitPayment(await paymentForm({ method_id: off.id }), other)).ok, false);
    assert.ok(!(await payments.activePaymentMethods()).some((item) => item.id === off.id));
  });

  it('approves once, unlocks, and notifies the member', async () => {
    const row = await db.paymentRequest.findFirst({ where: { user_id: member.id } });
    assert.equal((await payments.approvePayment(row.id, admin, 30, 'checked')).ok ?? true, true);
    assert.equal(await hasPaidAccess(member.id), true);
    const first = await db.memberAccess.findUnique({ where: { user_id: member.id } });
    await payments.approvePayment(row.id, admin, 30, 'again');
    const second = await db.memberAccess.findUnique({ where: { user_id: member.id } });
    assert.equal(second.expires_at.getTime(), first.expires_at.getTime(), 'approving twice must not add time');
    assert.equal(await db.notification.count({ where: { user_id: member.id, title: 'Your payment is approved' } }), 1);
    await payments.rejectPayment(row.id, admin, 'late');
    assert.equal((await db.paymentRequest.findUnique({ where: { id: row.id } })).status, 'approved', 'a reviewed payment cannot change');
    assert.equal((await payments.submitPayment(await paymentForm(), member)).ok, false, 'active members are not asked to pay again');
  });

  it('rejecting keeps content locked and allows another try', async () => {
    const other = await freshMember();
    const { id } = await payments.submitPayment(await paymentForm(), other);
    await payments.rejectPayment(id, admin, 'wrong amount');
    assert.equal(await hasPaidAccess(other.id), false);
    assert.equal((await payments.submitPayment(await paymentForm(), other)).ok, true);
  });

  it('access expires, extends from its end date, and can be revoked', async () => {
    const other = await freshMember();
    await payments.grantAccess(other.id, 10, admin);
    const first = (await db.memberAccess.findUnique({ where: { user_id: other.id } })).expires_at;
    await payments.grantAccess(other.id, 10, admin);
    const second = (await db.memberAccess.findUnique({ where: { user_id: other.id } })).expires_at;
    assert.equal(Math.round((second - first) / 86400000), 10);
    await payments.setAccessExpiry(other.id, new Date(Date.now() - 1000), admin);
    assert.equal(await hasPaidAccess(other.id), false);
    assert.equal(payments.accessState(await db.memberAccess.findUnique({ where: { user_id: other.id } })), 'expired');
    await payments.grantAccess(other.id, 0, admin);
    assert.equal(await hasPaidAccess(other.id), true, 'zero days means no expiry');
    await payments.revokeAccess(other.id, admin);
    assert.equal(await hasPaidAccess(other.id), false);
    assert.equal(payments.accessState(await db.memberAccess.findUnique({ where: { user_id: other.id } })), 'revoked');
  });

  it('sends contact details only to those allowed to have them', async () => {
    const profile = await getProfile(await approved({ contact_phone: '03001112222', contact_email: 'p@example.com' }));
    const restrictions = await getRestrictions();
    const stranger = await freshMember();
    const values = (result) => result.rows.map((row) => row.value).join();
    assert.equal(values(await contactFor(profile, null, restrictions, false)), '');
    assert.equal(values(await contactFor(profile, stranger, restrictions, false)), '');
    assert.ok((await contactFor(profile, stranger, restrictions, false)).locked.length > 0);
    assert.match(values(await contactFor(profile, stranger, restrictions, true)), /03001112222/);
    const open = { ...restrictions, phone: false };
    assert.match(values(await contactFor(profile, stranger, open, false)), /03001112222/);
    assert.equal(values(await contactFor(profile, null, open, false)), '', 'visitors never get contact details');
    assert.equal(await viewerIsPaid({ id: admin, role: 'admin' }), true);
  });

  it('the inbox switch stops unpaid members and only them', async () => {
    const [paid, unpaid, peer] = [await freshMember(), await freshMember(), await freshMember()];
    await payments.grantAccess(paid.id, 30, admin);
    for (const person of [paid, unpaid]) await db.profile.update({ where: { id: await approved() }, data: { user_id: person.id } });
    await saveSettings({ restrict_inbox: '1' });
    assert.equal(await chat.chatBlockReason(unpaid, peer.id), INBOX_LOCKED);
    assert.equal(await chat.chatBlockReason(paid, peer.id), null);
    await saveSettings({ restrict_inbox: '0' });
    assert.equal(await chat.chatBlockReason(unpaid, peer.id), null);
  });

  it('a blurred photo cannot be recognised', async () => {
    const raw = crypto.randomBytes(240 * 240 * 3);
    const target = path.join(dir, 'detail.webp');
    await sharp(raw, { raw: { width: 240, height: 240, channels: 3 } }).webp().toFile(target);
    const blurred = await uploads.blurredPhoto(target);
    const [before_, after_] = await Promise.all([sharp(target).stats(), sharp(blurred).stats()]);
    assert.ok(after_.channels[0].stdev < before_.channels[0].stdev / 3, 'fine detail is gone');
  });
});

describe('biodata import', async () => {
  const { parseBiodata, parseDate } = await import('../lib/biodata-import.js');
  const fixture = (name) => fs.readFileSync(path.join(import.meta.dirname, 'fixtures', name), 'utf8');

  it('reads every section of an Al Zaujain biodata', () => {
    const { values, unassigned } = parseBiodata(fixture('biodata-alzaujain.txt'));
    assert.equal(values.full_name, 'Ayesha Khan');
    assert.equal(values.headline_ur, 'عائشہ خان');
    assert.equal(values.gender, 'female');
    assert.equal(values.date_of_birth, '1999-01-01');
    assert.equal(values.height_cm, 163);
    assert.equal(values.education_level, 'Masters');
    assert.equal(values.degree, 'MSc Mathematics');
    assert.equal(values.occupation, 'Teacher');
    assert.equal(values.city, 'Multan');
    assert.equal(values.residence_area, 'City');
    assert.equal(values.father_status, 'Alive');
    assert.equal(values.father_occupation, 'Retired bank manager');
    assert.equal(values.brothers, 2);
    assert.equal(values.family_background, 'A well-educated family with roots in Punjab.');
    assert.match(values.description, /close-knit family/);
    assert.match(values.partner_demand, /^لڑکی تعلیم یافتہ/);
    assert.match(values.partner_demand, /باقی تفصیلات پرسنل۔$/);
    assert.equal(values.pref_age_min, 26);
    assert.equal(values.pref_age_max, 34);
    assert.equal(values.pref_education, 'Bachelors');
    assert.equal(values.contact_email, 'ayesha.khan@alzaujain.example');
    assert.deepEqual(unassigned, ['Original reference: AZ-28']);
  });

  it('handles a WhatsApp biodata and keeps what it cannot place', () => {
    const { values, unassigned } = parseBiodata(fixture('biodata-whatsapp.txt'));
    assert.equal(values.full_name, 'Bilal Ahmed');
    assert.equal(values.gender, 'male', 'the requirement describes the bride, so the candidate is the groom');
    assert.equal(values.height_cm, 178);
    assert.equal(values.caste, 'Arain');
    assert.equal(values.father_status, 'Deceased');
    assert.equal(values.contact_phone, '+971 50 123 4567');
    assert.ok(!values.partner_demand.includes('+971'));
    assert.ok(unassigned.includes('Own house in DHA Lahore'));
    assert.ok(unassigned.some((line) => line.startsWith('Brothers: 2 (both married)')));
    assert.ok(unassigned.some((line) => /estimated/.test(line)));
  });

  it('reads common date formats', () => {
    assert.equal(parseDate('01-02-1998'), '1998-02-01');
    assert.equal(parseDate('5 March 1997'), '1997-03-05');
    assert.equal(parseDate('March 5, 1997'), '1997-03-05');
    assert.equal(parseDate('31/02/1997'), null);
  });

  it('administrators only need the essentials', () => {
    const base = { full_name: 'A B', gender: 'female', date_of_birth: '1999-01-01', marital_status: 'Never married', country_id: 1, city: 'Multan' };
    assert.equal(validateProfile(base, { admin: true }).ok, true);
    assert.equal(validateProfile(base).ok, false, 'members still fill in the full form');
  });
});

describe('public, paid and premium profiles', () => {
  it('locks follow the profile type', async () => {
    const restrictions = { photo: true, phone: true, email: true, whatsapp: true, inbox: false, other: true };
    const { profileLocks } = await import('../lib/restrictions.js');
    assert.deepEqual(profileLocks({ access_type: 'public' }, { restrictions, paid: false }), { photo: false, whatsapp: false, other: false, premium: false });
    assert.equal(profileLocks({ access_type: 'paid' }, { restrictions, paid: false }).photo, true);
    assert.equal(profileLocks({ access_type: 'paid' }, { restrictions, paid: true }).photo, false);
    assert.equal(profileLocks({ access_type: 'premium' }, { restrictions, paid: true }).premium, true, 'payment never opens a premium profile');
    assert.equal(profileLocks({ access_type: 'premium' }, { restrictions, paid: false, manager: true }).premium, false);
  });

  it('contact details: open on public, never on premium', async () => {
    const restrictions = await getRestrictions();
    const id = await approved({ contact_phone: '03009998887' });
    const stranger = await makeUser({ email: `type${Math.random()}@example.com` });
    await db.profile.update({ where: { id }, data: { access_type: 'public' } });
    assert.match((await contactFor(await getProfile(id), null, restrictions, false)).rows.map((row) => row.value).join(), /03009998887/, 'visitors see a public profile');
    await db.profile.update({ where: { id }, data: { access_type: 'premium' } });
    const premium = await contactFor(await getProfile(id), stranger, restrictions, true);
    assert.equal(premium.rows.length, 0, 'even a paid member gets nothing');
  });

  it('new member profiles are always paid', async () => {
    const id = await approved();
    const row = await db.profile.findUnique({ where: { id } });
    assert.equal(row.access_type, 'paid');
    assert.equal(row.source, 'user');
  });
});

describe('premium profile credits', () => {
  const credits = { mod: null };
  let admin; let method; let pack;
  const receipt = async () => new File([await sharp({ create: { width: 200, height: 200, channels: 3, background: '#557733' } }).jpeg().toBuffer()], 'r.jpg', { type: 'image/jpeg' });
  const buy = async (member, fields = {}) => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ method_id: method, sender_name: 'Sender', transaction_id: `CR${Math.random()}`, amount: '1000', package_id: pack.id, ...fields })) form.set(key, String(value));
    form.set('receipt', await receipt());
    return payments.submitPayment(form, member);
  };
  const member = (label) => makeUser({ email: `credit-${label}-${Math.random()}@example.com` });
  const paidProfile = async (overrides = {}) => {
    const id = await approved({ full_name: `Paid ${Math.random()}`, contact_phone: '0300 1112233', ...overrides });
    await db.profile.update({ where: { id }, data: { access_type: 'paid' } });
    return id;
  };
  const balance = async (user) => (await load(user.id)).credits;

  before(async () => {
    credits.mod = await import('../lib/credits.js');
    admin = (await makeUser({ email: 'creditadmin@example.com', role: 'admin' })).id;
    method = (await db.paymentMethod.create({ data: { name: 'Credits bank', account_holder: 'Al Zaujain', bank_name: 'Meezan', iban: 'PK01' } })).id;
    pack = await db.creditPackage.create({ data: { name: 'Starter', credits: 5, price: '1000' } });
  });

  it('a package payment adds exactly its credits on approval, and only once', async () => {
    const user = await member('buy');
    const sent = await buy(user);
    assert.equal(sent.ok, true);
    assert.equal(await balance(user), 0, 'nothing is added before approval');
    const row = await db.paymentRequest.findUnique({ where: { id: sent.id } });
    assert.equal(row.credits, 5);
    assert.equal(row.package_name, 'Starter');
    const [first, second] = await Promise.all([payments.approvePayment(sent.id, admin, 0, null), payments.approvePayment(sent.id, admin, 0, null)]);
    assert.equal([first, second].filter(Boolean).length, 1, 'two admins approving together add the credits once');
    assert.equal(await balance(user), 5);
    const ledger = await db.creditTransaction.findMany({ where: { user_id: user.id } });
    assert.deepEqual(ledger.map((entry) => [entry.kind, entry.amount, entry.balance_after]), [['purchase', 5, 5]]);
    assert.equal(await hasPaidAccess(user.id), false, 'credits are not the full-access membership');
  });

  it('a rejected package payment adds nothing, and an inactive package cannot be bought', async () => {
    const user = await member('reject');
    const sent = await buy(user);
    await payments.rejectPayment(sent.id, admin, 'Wrong amount');
    assert.equal(await balance(user), 0);
    const hidden = await db.creditPackage.create({ data: { name: 'Old', credits: 3, price: '500', active: false } });
    assert.equal((await buy(user, { package_id: hidden.id })).ok, false);
    assert.equal((await buy(user)).ok, true);
    assert.equal((await buy(user)).ok, false, 'one credit purchase waits for review at a time');
  });

  it('unlocking a paid profile costs one credit, and opening it again costs nothing', async () => {
    const user = await member('unlock');
    await credits.mod.adjustCredits(user.id, 3, 'Test credits', admin);
    const id = await paidProfile();
    const first = await credits.mod.unlockProfile(user, id);
    assert.deepEqual([first.charged, first.balance], [1, 2]);
    const again = await credits.mod.unlockProfile(user, id);
    assert.deepEqual([again.charged, again.balance], [0, 2]);
    assert.equal(await balance(user), 2);
    assert.equal(await credits.mod.hasUnlocked(user.id, id), true);
  });

  it('many simultaneous unlocks of one profile charge once', async () => {
    const user = await member('race');
    await credits.mod.adjustCredits(user.id, 5, 'Test credits', admin);
    const id = await paidProfile();
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => credits.mod.unlockProfile(user, id)));
    assert.ok(results.every((result) => result.status === 'fulfilled'), JSON.stringify(results.filter((r) => r.status === 'rejected').map((r) => String(r.reason))));
    assert.equal(results.reduce((sum, result) => sum + result.value.charged, 0), 1);
    assert.equal(await balance(user), 4);
    assert.equal(await db.profileUnlock.count({ where: { user_id: user.id } }), 1);
  });

  it('simultaneous unlocks of different profiles never spend more than the balance', async () => {
    const user = await member('overspend');
    await credits.mod.adjustCredits(user.id, 2, 'Test credits', admin);
    const ids = await Promise.all(Array.from({ length: 5 }, () => paidProfile()));
    const results = await Promise.allSettled(ids.map((id) => credits.mod.unlockProfile(user, id)));
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2);
    assert.ok(results.filter((result) => result.status === 'rejected').every((result) => result.reason.code === 'insufficient'));
    assert.equal(await balance(user), 0);
    assert.equal(await db.profileUnlock.count({ where: { user_id: user.id } }), 2, 'a refused unlock leaves no row behind');
  });

  it('refuses with a clear message when credits run out, and the balance never goes negative', async () => {
    const user = await member('empty');
    const id = await paidProfile();
    await assert.rejects(credits.mod.unlockProfile(user, id), (error) => error.code === 'insufficient' && /Please buy a premium credit package/.test(error.message));
    await assert.rejects(db.user.update({ where: { id: user.id }, data: { credits: -1 } }), 'the database refuses a negative balance');
    await assert.rejects(credits.mod.adjustCredits(user.id, -1, 'Too many', admin), /fewer than 0/);
  });

  it('free and exclusive profiles never use credits; staff and owners cannot spend any', async () => {
    const user = await member('types');
    await credits.mod.adjustCredits(user.id, 2, 'Test credits', admin);
    const free = await approved({ full_name: 'Free Person' });
    await db.profile.update({ where: { id: free }, data: { access_type: 'public' } });
    const exclusive = await approved({ full_name: 'Exclusive Person' });
    await db.profile.update({ where: { id: exclusive }, data: { access_type: 'premium' } });
    await assert.rejects(credits.mod.unlockProfile(user, free), (error) => error.code === 'not_paid');
    await assert.rejects(credits.mod.unlockProfile(user, exclusive), (error) => error.code === 'not_paid');
    const own = await paidProfile();
    await db.profile.update({ where: { id: own }, data: { user_id: user.id } });
    await assert.rejects(credits.mod.unlockProfile(user, own), (error) => error.code === 'own');
    await assert.rejects(credits.mod.unlockProfile({ id: admin, role: 'admin' }, own), (error) => error.code === 'member');
    assert.equal(await balance(user), 2);
  });

  it('contact details and the full name stay hidden until the member unlocks the profile', async () => {
    const { profileView } = await import('../lib/profile-view.js');
    const user = await member('view');
    await credits.mod.adjustCredits(user.id, 1, 'Test credits', admin);
    const id = await paidProfile({ full_name: 'Maryam Siddiqui', contact_phone: '0300 9998877' });
    const before = await profileView(await getProfile(id), user, '1.1.1.1');
    assert.deepEqual(before.contact.rows, []);
    assert.ok(before.contact.locked.includes('Phone'));
    assert.equal(before.data.name, 'Maryam');
    assert.equal(before.credits.canUnlock, true);
    await credits.mod.unlockProfile(user, id);
    const after = await profileView(await getProfile(id), user, '1.1.1.1');
    assert.deepEqual(after.contact.rows.map((row) => row.value), ['0300 9998877', 'person@example.com']);
    assert.equal(after.data.name, 'Maryam Siddiqui');
    assert.equal(after.credits.unlocked, true);
    const stranger = await profileView(await getProfile(id), await member('stranger'), '2.2.2.2');
    assert.deepEqual(stranger.contact.rows, [], 'unlocking is per member');
  });

  it('manual adjustments need a reason, and removing an unlock can refund it', async () => {
    const user = await member('adjust');
    await assert.rejects(credits.mod.adjustCredits(user.id, 5, '  ', admin), /reason is required/);
    await credits.mod.adjustCredits(user.id, 2, 'Goodwill', admin);
    const id = await paidProfile();
    await credits.mod.unlockProfile(user, id);
    const unlock = await db.profileUnlock.findFirst({ where: { user_id: user.id } });
    await credits.mod.revokeUnlock(unlock.id, true, admin);
    assert.equal(await balance(user), 2);
    assert.equal(await credits.mod.hasUnlocked(user.id, id), false);
    const kinds = (await db.creditTransaction.findMany({ where: { user_id: user.id }, orderBy: { id: 'asc' } })).map((row) => `${row.kind}:${row.amount}:${row.balance_after}`);
    assert.deepEqual(kinds, ['adjustment:2:2', 'unlock:-1:1', 'refund:1:2']);
    const summary = await credits.mod.creditSummary(user.id);
    assert.deepEqual([summary.balance, summary.purchased, summary.used], [2, 2, 0]);
    assert.ok(await db.activityLog.findFirst({ where: { action: 'credits_adjusted', detail: { contains: 'Goodwill' } } }), 'adjustments are in the audit log');
  });

  it('the fee structure is separate, editable, and starts with the official figures', async () => {
    const fees = await import('../lib/fees.js');
    const current = await fees.getFees();
    assert.equal(current.registration[0].fee, 'Rs. 5,000');
    assert.equal(current.finalization.at(-1).fee, 'Rs. 500,000');
    await fees.saveFees({ ...current, registration: [...current.registration, { category: '', fee: '' }], whatsapp: '0300 0000000' });
    const saved = await fees.getFees();
    assert.equal(saved.registration.length, 4, 'empty rows are ignored');
    assert.equal(saved.whatsapp, '0300 0000000');
    assert.equal(fees.whatsappDigits('0339-9077424'), '923399077424');
    assert.equal(await db.creditPackage.count({ where: { name: { contains: 'registration' } } }), 0);
  });
});

describe('card photo chosen like a WhatsApp picture', () => {
  // A tall photo: red on top (the face), blue below.
  const tall = async () => {
    const top = await sharp({ create: { width: 600, height: 600, channels: 3, background: '#d02020' } }).png().toBuffer();
    const buffer = await sharp({ create: { width: 600, height: 1200, channels: 3, background: '#2030d0' } }).composite([{ input: top, top: 0, left: 0 }]).jpeg().toBuffer();
    return new File([buffer], 'tall.jpg', { type: 'image/jpeg' });
  };
  const colour = async (name) => {
    const { dominant } = await sharp(path.join(uploads.photosDir(), name)).stats();
    return dominant.r > dominant.b ? 'red' : 'blue';
  };

  it('cuts the card picture from the chosen part and keeps the full photo', async () => {
    const top = await uploads.savePhoto(await tall(), 'Photo', JSON.stringify({ x: 0, y: 0, w: 1, h: 0.5 }));
    assert.equal(await colour(top.thumb), 'red');
    const bottom = await uploads.savePhoto(await tall(), 'Photo', { x: 0, y: 0.5, w: 1, h: 0.5 });
    assert.equal(await colour(bottom.thumb), 'blue');
    const full = await sharp(path.join(uploads.photosDir(), top.file)).metadata();
    assert.deepEqual([full.width, full.height], [600, 1200], 'the full photo is untouched');
  });

  it('ignores a malformed crop and can re-cut a photo later', async () => {
    assert.equal(uploads.parseCrop('{"x":0.5,"y":0,"w":0.9,"h":0.5}'), null, 'outside the photo');
    assert.equal(uploads.parseCrop('nonsense'), null);
    const saved = await uploads.savePhoto(await tall(), 'Photo', 'nonsense');
    const again = await uploads.recropPhoto(saved.file, { x: 0, y: 0.5, w: 1, h: 0.5 });
    assert.equal(await colour(again), 'blue');
  });
});

describe('WhatsApp numbers', () => {
  it('accept the ways people write them', async () => {
    const { whatsappNumber } = await import('../lib/format.js');
    for (const typed of ['923001234567', '+92 300 1234567', '+92-300-1234567', '0300 1234567', '0300-1234567', '03001234567', '3001234567', '0092 300 1234567', ' (0300) 123 4567 ']) {
      assert.equal(whatsappNumber(typed), '923001234567', typed);
    }
    assert.equal(whatsappNumber('+44 7700 900123'), '447700900123');
    assert.equal(whatsappNumber(''), '');
    assert.equal(whatsappNumber('12345'), null);
    assert.equal(whatsappNumber('abc'), '');
  });
});
