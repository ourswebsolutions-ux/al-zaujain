import { getDb } from './db.js';

// Who a consultant is shown to. "team" consultants work only inside the admin and consultant panels;
// "city" consultants appear only for families of their city.
export const AUDIENCES = ['everyone', 'team', 'city'];

const ORDER = [{ experience_years: 'desc' }, { display_name: 'asc' }];

/**
 * The consultants a visitor may see. Everyone-consultants always; city consultants only when the
 * visitor has chosen that city (or, for a member, it is their profile's city).
 */
export function publicConsultants({ city } = {}) {
  const where = city
    ? { is_public: true, OR: [{ audience: 'everyone' }, { audience: 'city', audience_city: city }] }
    : { is_public: true, audience: 'everyone' };
  return getDb().consultant.findMany({ where, orderBy: ORDER });
}

// The cities that have their own consultants, for the city choice on the consultants page.
export async function consultantCities() {
  const rows = await getDb().consultant.findMany({ where: { is_public: true, audience: 'city', audience_city: { not: null } }, select: { audience_city: true }, distinct: ['audience_city'], orderBy: { audience_city: 'asc' } });
  return rows.map((row) => row.audience_city).filter(Boolean);
}

// A consultant's own page opens for everyone and city consultants; team consultants have none.
export const consultantBySlug = (slug) => getDb().consultant.findFirst({ where: { slug, is_public: true } });

// Reads the setting from the admin form and keeps is_public in step with it.
export function readAudience(form) {
  const audience = AUDIENCES.includes(String(form.get('audience'))) ? String(form.get('audience')) : 'everyone';
  const city = String(form.get('audience_city') ?? '').trim().slice(0, 80);
  if (audience === 'city' && !city) return { error: 'Choose the city this consultant serves.' };
  return { audience, audience_city: audience === 'city' ? city : null, is_public: audience !== 'team' };
}

// Working days a consultant can choose, and how they read on the card.
export const WORK_DAYS = { 'mon-sat': ['Mon to Sat', [1, 2, 3, 4, 5, 6]], 'mon-fri': ['Mon to Fri', [1, 2, 3, 4, 5]], everyday: ['Every Day', [0, 1, 2, 3, 4, 5, 6]] };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const clock = (value) => {
  const [h, m] = value.split(':').map(Number);
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};

/**
 * The working hours on a consultant's card ("Mon to Sat | 10 AM - 7 PM") and whether they are working
 * right now, in Pakistan time. Without hours there is no online/offline badge.
 */
export function availability(consultant, now = new Date()) {
  const [daysLabel, days] = WORK_DAYS[consultant.work_days] ?? WORK_DAYS['mon-sat'];
  const from = TIME.test(consultant.hours_from ?? '') ? consultant.hours_from : null;
  const to = TIME.test(consultant.hours_to ?? '') ? consultant.hours_to : null;
  if (!from || !to) return { hours: null, online: null };
  const local = new Date(now.getTime() + 5 * 3600000); // Pakistan is UTC+5 all year.
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const online = days.includes(local.getUTCDay()) && minutes >= toMinutes(from) && minutes < toMinutes(to);
  return { hours: `${daysLabel} | ${clock(from)} - ${clock(to)}`, online };
}

export function readCardFields(form) {
  const text = (key, max) => String(form.get(key) ?? '').trim().slice(0, max);
  const rating = text('rating', 4);
  const value = rating === '' ? null : Number(rating);
  if (value !== null && (!Number.isFinite(value) || value < 1 || value > 5)) return { error: 'Rating must be between 1 and 5, or left empty.' };
  const from = text('hours_from', 5);
  const to = text('hours_to', 5);
  if ((from && !TIME.test(from)) || (to && !TIME.test(to))) return { error: 'Enter working hours like 10:00 and 19:00.' };
  if (from && to && from >= to) return { error: 'The working day must end after it starts.' };
  return {
    specialties: text('specialties', 255) || null,
    rating: value === null ? null : Math.round(value * 10) / 10,
    work_days: WORK_DAYS[text('work_days', 10)] ? text('work_days', 10) : 'mon-sat',
    hours_from: from || null,
    hours_to: to || null,
  };
}
