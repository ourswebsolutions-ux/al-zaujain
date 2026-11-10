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
