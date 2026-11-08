import { getDb } from './db.js';
import { ageFromDob, profileCode } from './format.js';
import { flattenProfile, toCard } from './profiles.js';
import { getSetting, getSettings } from './settings.js';

const norm = (value) => (value ?? '').toString().trim().toLowerCase();
const same = (a, b) => !!norm(a) && norm(a) === norm(b);
const contains = (haystack, needle) => !!norm(needle) && !!norm(haystack) && (norm(haystack).includes(norm(needle)) || norm(needle).includes(norm(haystack)));

export async function getWeights() {
  try {
    return JSON.parse(await getSetting('match_weights'));
  } catch {
    return { age: 25, religion: 20, caste: 15, education: 10, city: 10, country: 10, preferences: 10 };
  }
}

// 0–1 fit of `candidate` against what `seeker` asks for on one person's age range.
function ageFit(seeker, candidate) {
  const age = ageFromDob(candidate.date_of_birth);
  if (seeker.pref_age_min || seeker.pref_age_max) {
    const min = seeker.pref_age_min ?? 18;
    const max = seeker.pref_age_max ?? 99;
    if (age >= min && age <= max) return 1;
    const gap = age < min ? min - age : age - max;
    return Math.max(0, 1 - gap / 8);
  }
  const gap = Math.abs(ageFromDob(seeker.date_of_birth) - age);
  return Math.max(0, 1 - gap / 12);
}

function preferenceFit(seeker, candidate) {
  const checks = [];
  if (seeker.pref_marital_status) checks.push(same(seeker.pref_marital_status, candidate.marital_status));
  if (seeker.pref_height_min && candidate.height_cm) checks.push(candidate.height_cm >= seeker.pref_height_min);
  if (seeker.pref_profession) checks.push(contains(candidate.occupation, seeker.pref_profession) || contains(candidate.job_title, seeker.pref_profession));
  if (seeker.pref_country) checks.push(same(seeker.pref_country, candidate.country_name));
  return checks.length ? checks.filter(Boolean).length / checks.length : 0.5;
}

function oneWay(seeker, candidate, weights) {
  const parts = {
    age: ageFit(seeker, candidate),
    religion: same(seeker.religion, candidate.religion) ? (!seeker.sect || !candidate.sect || same(seeker.sect, candidate.sect) ? 1 : 0.7) : 0,
    caste: seeker.pref_caste ? (contains(candidate.caste, seeker.pref_caste) ? 1 : 0) : (same(seeker.caste, candidate.caste) ? 1 : 0.4),
    education: seeker.pref_education
      ? (contains(candidate.degree, seeker.pref_education) || contains(candidate.education_level, seeker.pref_education) ? 1 : 0.3)
      : (same(seeker.education_level, candidate.education_level) ? 1 : 0.5),
    city: seeker.pref_city ? (same(seeker.pref_city, candidate.city) ? 1 : 0) : (same(seeker.city, candidate.city) ? 1 : 0.3),
    country: same(seeker.country_name, candidate.country_name) ? 1 : 0.2,
    preferences: preferenceFit(seeker, candidate),
  };
  let total = 0;
  let weight = 0;
  for (const [key, value] of Object.entries(parts)) {
    total += value * (weights[key] ?? 0);
    weight += weights[key] ?? 0;
  }
  return weight ? total / weight : 0;
}

// Both sides' preferences count, so a match is one that works for both families.
export function matchScore(a, b, weights) {
  return Math.round((oneWay(a, b, weights) * 0.6 + oneWay(b, a, weights) * 0.4) * 100);
}

const CANDIDATE_LIMIT = 400;

const CANDIDATE_INCLUDE = {
  country: { select: { name: true } },
  photos: { select: { thumb: true }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], take: 1 },
};

// Scoring keeps everything in the row; toCard reduces it to public fields before it leaves.
const withCountry = (row) => ({ ...row, country_name: row.country?.name ?? null });

// Newest proposals of the same religion first, topped up with others if there are too few.
async function candidates(profile, gender) {
  const db = getDb();
  const base = { status: 'approved', gender, id: { not: profile.id }, ...(profile.user_id ? { OR: [{ user_id: null }, { user_id: { not: profile.user_id } }] } : {}) };
  const query = (where, take) => db.profile.findMany({ where, include: CANDIDATE_INCLUDE, orderBy: { approved_at: 'desc' }, take });
  const same = await query({ ...base, religion: profile.religion }, CANDIDATE_LIMIT);
  const rest = same.length < CANDIDATE_LIMIT ? await query({ ...base, NOT: { religion: profile.religion } }, CANDIDATE_LIMIT - same.length) : [];
  return [...same, ...rest].map(withCountry);
}

const opposite = (gender) => (gender === 'female' ? 'male' : 'female');

export async function compatibleProfiles(profile, limit = 4) {
  const weights = await getWeights();
  const rows = await candidates(profile, opposite(profile.gender));
  return rows
    .map((row) => ({ row, score: matchScore(profile, row, weights) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row, score }) => ({ ...toCard(row), score }));
}

// Same gender, closest in age, caste, city and background.
export async function similarProfiles(profile, limit = 4) {
  const age = ageFromDob(profile.date_of_birth);
  const score = (row) => (
    Math.max(0, 1 - Math.abs(ageFromDob(row.date_of_birth) - age) / 10) * 35
    + (same(row.caste, profile.caste) ? 25 : 0)
    + (same(row.city, profile.city) ? 15 : 0)
    + (same(row.country_name, profile.country_name) ? 10 : 0)
    + (same(row.education_level, profile.education_level) ? 15 : 0)
  );
  const rows = await candidates(profile, profile.gender);
  return rows
    .map((row) => ({ row, score: score(row) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => toCard(row));
}

// A registered user's most recently updated approved profile is the one matched on their behalf.
export async function approvedProfileOf(userId) {
  return flattenProfile(await getDb().profile.findFirst({
    where: { user_id: userId, status: 'approved' },
    include: { country: { select: { name: true } } },
    orderBy: { updated_at: 'desc' },
  }));
}

export async function matchesForUser(userId, limit = 12) {
  const profile = await approvedProfileOf(userId);
  return profile ? { profile, matches: await compatibleProfiles(profile, limit) } : { profile: null, matches: [] };
}

function isDue(user, now) {
  if (!user.match_last_sent_at) return true;
  const days = user.match_frequency === 'daily' ? 1 : 7;
  return now - user.match_last_sent_at.getTime() >= days * 86400000 - 3600000;
}

// Scores matches for each due user and records each pair after a successful send only,
// so a mail failure retries next run and nobody gets the same proposal twice.
export async function runMatchEmails({ send, baseUrl, force = false }) {
  const db = getDb();
  const settings = await getSettings();
  const summary = { checked: 0, emailed: 0, matches: 0, failed: 0 };
  if (settings.match_enabled !== '1' && !force) return { ...summary, skipped: 'Automatic matching is switched off.' };

  const minScore = Number(settings.match_min_score) || 60;
  const maxPerEmail = Number(settings.match_max_per_email) || 5;
  const weights = await getWeights();
  const now = Date.now();

  const users = await db.user.findMany({
    where: { role: 'user', status: 'active', match_emails: true, match_frequency: { not: 'off' } },
    select: { id: true, name: true, email: true, match_frequency: true, match_last_sent_at: true },
  });

  for (const user of users) {
    if (!force && !isDue(user, now)) continue;
    const profile = await approvedProfileOf(user.id);
    if (!profile) continue;
    summary.checked += 1;

    const sentRows = await db.matchNotification.findMany({ where: { user_id: user.id }, select: { matched_profile_id: true } });
    const alreadySent = new Set(sentRows.map((row) => row.matched_profile_id));
    const fresh = (await candidates(profile, opposite(profile.gender)))
      .filter((row) => !alreadySent.has(row.id))
      .map((row) => ({ row, score: matchScore(profile, row, weights) }))
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPerEmail);
    if (fresh.length === 0) continue;

    const list = fresh.map(({ row, score }) => {
      const card = toCard(row);
      return `${card.name}, ${card.age} · ${[card.city, card.country].filter(Boolean).join(', ')} · ${score}% match\n${baseUrl}/profile/${profileCode(row.id)}`;
    }).join('\n\n');

    const result = await send(user, { count: fresh.length, matches: list });
    if (result === 'sent') {
      await db.$transaction([
        db.matchNotification.createMany({ data: fresh.map(({ row, score }) => ({ user_id: user.id, matched_profile_id: row.id, score })), skipDuplicates: true }),
        db.user.update({ where: { id: user.id }, data: { match_last_sent_at: new Date() } }),
      ]);
      summary.emailed += 1;
      summary.matches += fresh.length;
    } else {
      summary.failed += 1;
    }
  }
  return summary;
}
