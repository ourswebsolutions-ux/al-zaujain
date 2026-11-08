import { getDb } from './db.js';
import { NATIONALITIES } from './profile-schema.js';

export const activeCategories = () => getDb().category.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { name: 'asc' }] });
export const categoryBySlug = (slug) => getDb().category.findFirst({ where: { slug, active: true } });
export const countriesInCategory = (categoryId) => getDb().country.findMany({ where: { category_id: categoryId, active: true }, orderBy: [{ sort: 'asc' }, { name: 'asc' }] });

export async function activeCountries() {
  const rows = await getDb().country.findMany({ where: { active: true }, select: { id: true, name: true, slug: true, category_id: true }, orderBy: { name: 'asc' } });
  return [...rows.filter((row) => row.name === 'Pakistan'), ...rows.filter((row) => row.name !== 'Pakistan')];
}

const CITY_ORDER = [{ featured: 'desc' }, { name: 'asc' }];

export const citiesInCountry = (countryId) => getDb().city.findMany({ where: { country_id: countryId, active: true }, select: { id: true, name: true, slug: true }, orderBy: CITY_ORDER });

export async function featuredCities() {
  const rows = await getDb().city.findMany({ where: { featured: true, active: true }, select: { name: true }, orderBy: { id: 'asc' } });
  return rows.map((row) => row.name);
}

export const citiesInCategory = (categoryId) => getDb().city.findMany({ where: { active: true, country: { category_id: categoryId } }, select: { name: true, slug: true }, distinct: ['name'], orderBy: CITY_ORDER });

export async function allCityNames() {
  const rows = await getDb().city.findMany({ where: { active: true }, select: { name: true }, distinct: ['name'], orderBy: CITY_ORDER });
  return rows.map((row) => row.name);
}

export const cityInCategory = (categoryId, slug) => getDb().city.findFirst({ where: { slug, active: true, country: { category_id: categoryId } }, select: { name: true } });

// Cities with their country, so a city list can follow the chosen country.
export async function citiesWithCountry() {
  const rows = await getDb().city.findMany({ where: { active: true, country: { active: true } }, select: { name: true, country: { select: { name: true } } }, orderBy: CITY_ORDER });
  return rows.map((row) => ({ name: row.name, country: row.country.name }));
}

// The managed caste list, popular ones first.
export const activeCastes = () => getDb().caste.findMany({ where: { active: true }, select: { name: true, name_ur: true, popular: true }, orderBy: [{ popular: 'desc' }, { sort: 'asc' }, { name: 'asc' }] });

// Options for the searchable caste lists: the English name, with the Urdu one alongside.
export async function casteOptions() {
  return (await activeCastes()).map((caste) => ({ value: caste.name, alt: caste.name_ur ?? undefined, popular: caste.popular }));
}

// The usual nationalities, plus any others already on approved profiles.
export async function nationalityOptions() {
  const rows = await getDb().profile.groupBy({ by: ['nationality'], where: { status: 'approved', nationality: { not: null } }, _count: { nationality: true }, orderBy: { _count: { nationality: 'desc' } }, take: 40 });
  const known = new Set(NATIONALITIES.map((value) => value.toLowerCase()));
  return [...NATIONALITIES.filter((value) => value !== 'Other'), ...rows.map((row) => row.nationality).filter((value) => value.length <= 40 && !known.has(value.toLowerCase()))];
}
