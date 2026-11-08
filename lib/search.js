import { getDb } from './db.js';
import { CARD_SELECT, toCard } from './profiles.js';

export const PAGE_SIZE = 12;

export const SORTS = {
  newest: { label: 'Newest first', order: [{ approved_at: 'desc' }, { id: 'desc' }] },
  verified: { label: 'Verified first', order: [{ verification_status: 'desc' }, { approved_at: 'desc' }, { id: 'desc' }] },
  age_low: { label: 'Age: youngest first', order: [{ date_of_birth: 'desc' }] },
  age_high: { label: 'Age: oldest first', order: [{ date_of_birth: 'asc' }] },
};

const MIN_FULLTEXT_WORD = 3;
const MAX_MATCHES = 5000;

// Reduces input to plain words, so it can never be read as boolean search syntax.
export const searchWords = (text = '') => (text.normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 8);

export const fulltextQuery = (words) => words.filter((word) => word.length >= MIN_FULLTEXT_WORD).map((word) => `+${word}*`).join(' ');

const dobForAge = (age, now = new Date()) => new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()));

const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 80) : '');

export function parseFilters(params = {}) {
  const filters = {};
  for (const key of ['q', 'gender', 'city', 'country', 'caste', 'education', 'profession', 'marital', 'religion', 'sect', 'nationality']) {
    const value = clean(params[key]);
    if (value) filters[key] = value;
  }
  let ageMin = Number(params.age_min) || null;
  let ageMax = Number(params.age_max) || null;
  if (typeof params.age === 'string' && /^\d{2}-\d{2}$/.test(params.age)) [ageMin, ageMax] = params.age.split('-').map(Number);
  if (ageMin) filters.ageMin = Math.min(Math.max(ageMin, 18), 99);
  if (ageMax) filters.ageMax = Math.min(Math.max(ageMax, 18), 99);
  for (const [key, name] of [['heightMin', 'height_min'], ['heightMax', 'height_max']]) {
    const cm = Number(params[name]);
    if (Number.isInteger(cm) && cm >= 100 && cm <= 250) filters[key] = cm;
  }
  if (params.verified === '1') filters.verified = true;
  if (params.photo === '1') filters.photo = true;
  filters.sort = SORTS[params.sort] ? params.sort : 'newest';
  filters.page = Math.max(1, Math.min(Number(params.page) || 1, 10000));
  return filters;
}

// Returns matching ids, or null when no keyword was given.
async function keywordIds(q) {
  const words = searchWords(q);
  if (words.length === 0) return null;
  const db = getDb();
  const query = fulltextQuery(words);
  const shortWords = words.filter((word) => word.length < MIN_FULLTEXT_WORD);
  if (!query) {
    const rows = await db.profile.findMany({ where: { status: 'approved', AND: shortWords.map((word) => ({ search_text: { contains: word } })) }, select: { id: true }, take: MAX_MATCHES });
    return rows.map((row) => row.id);
  }
  const rows = await db.$queryRaw`SELECT id FROM profiles WHERE status = 'approved' AND MATCH(search_text) AGAINST (${query} IN BOOLEAN MODE) LIMIT ${MAX_MATCHES}`;
  const ids = rows.map((row) => Number(row.id));
  if (shortWords.length === 0 || ids.length === 0) return ids;
  const narrowed = await db.profile.findMany({ where: { id: { in: ids }, AND: shortWords.map((word) => ({ search_text: { contains: word } })) }, select: { id: true } });
  return narrowed.map((row) => row.id);
}

function buildWhere(filters, scope, ids) {
  const and = [{ status: 'approved' }];
  if (ids) and.push({ id: { in: ids } });
  if (filters.gender === 'female' || filters.gender === 'male') and.push({ gender: filters.gender });
  if (filters.city === 'overseas') and.push({ country: { name: { not: 'Pakistan' } } });
  else if (filters.city) and.push({ city: filters.city });
  if (filters.country) and.push({ country: { name: filters.country } });
  if (filters.caste) and.push({ caste: { contains: filters.caste } });
  if (filters.education) and.push({ OR: [{ education_level: filters.education }, { degree: { contains: filters.education } }] });
  if (filters.profession) and.push({ OR: [{ occupation: { contains: filters.profession } }, { job_title: { contains: filters.profession } }] });
  if (filters.marital) and.push({ marital_status: filters.marital });
  if (filters.religion) and.push({ religion: filters.religion });
  if (filters.sect) and.push({ sect: filters.sect });
  if (filters.nationality) and.push({ nationality: { contains: filters.nationality } });
  if (filters.heightMin) and.push({ height_cm: { gte: filters.heightMin } });
  if (filters.heightMax) and.push({ height_cm: { lte: filters.heightMax } });
  if (filters.ageMin) and.push({ date_of_birth: { lte: dobForAge(filters.ageMin) } });
  if (filters.ageMax) and.push({ date_of_birth: { gt: dobForAge(filters.ageMax + 1) } });
  if (filters.verified) and.push({ verification_status: 'verified' });
  if (filters.photo) and.push({ photo_public: true, photos: { some: {} } });
  if (scope.categoryId) and.push({ country: { category_id: scope.categoryId } });
  if (scope.countryId) and.push({ country_id: scope.countryId });
  if (scope.city) and.push({ city: scope.city });
  return { AND: and };
}

export async function searchProfiles(filters, scope = {}, pageSize = PAGE_SIZE) {
  const db = getDb();
  const ids = await keywordIds(filters.q);
  if (ids && ids.length === 0) return { total: 0, page: 1, pages: 1, profiles: [] };
  const where = buildWhere(filters, scope, ids);
  const total = await db.profile.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page ?? 1, pages);
  const rows = await db.profile.findMany({ where, select: CARD_SELECT, orderBy: SORTS[filters.sort ?? 'newest'].order, take: pageSize, skip: (page - 1) * pageSize });
  return { total, page, pages, profiles: rows.map(toCard) };
}
