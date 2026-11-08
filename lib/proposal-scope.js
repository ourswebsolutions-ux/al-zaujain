// What a proposals listing covers: everything, one region, one country or one city.
// Shared by the website's /proposals pages and the mobile app, so both list exactly the same profiles.
import { activeCategories, activeCountries, categoryBySlug, citiesInCategory, citiesWithCountry, cityInCategory, countriesInCategory } from './places.js';

// Resolves /proposals, /proposals/gulf, /proposals/gulf/qatar and /proposals/pakistan/multan.
export async function resolveScope(slug = []) {
  if (slug.length === 0) return { scope: {}, title: 'All proposals', path: '/proposals' };
  if (slug.length > 2) return null;
  const category = await categoryBySlug(slug[0]);
  if (!category) return null;
  const countries = await countriesInCategory(category.id);
  const base = { category, countries, path: `/proposals/${slug.join('/')}` };
  if (slug.length === 1) return { ...base, scope: { categoryId: category.id }, title: `${category.name} proposals` };

  const country = countries.find((item) => item.slug === slug[1]);
  if (country) return { ...base, country, scope: { countryId: country.id }, title: `${country.name} proposals` };

  const city = await cityInCategory(category.id, slug[1]);
  if (!city) return null;
  return { ...base, city: city.name, scope: { categoryId: category.id, city: city.name }, title: `${city.name} proposals` };
}

// The location tabs above the results. `all` items read "All {name}"; the rest show their name.
export async function scopeTabs({ category, countries }) {
  if (!category) {
    return [{ href: '/proposals', name: 'All proposals' }, ...(await activeCategories()).map((item) => ({ href: `/proposals/${item.slug}`, name: item.name }))];
  }
  const inside = countries.length > 1
    ? countries.map((country) => ({ href: `/proposals/${category.slug}/${country.slug}`, name: country.name }))
    : (await citiesInCategory(category.id)).slice(0, 12).map((city) => ({ href: `/proposals/${category.slug}/${city.slug}`, name: city.name }));
  return [{ href: `/proposals/${category.slug}`, name: category.name, all: true }, ...inside];
}

// The countries and cities offered in the filters: only those inside the current scope.
export async function scopePlaces({ category, countries }) {
  const countryOptions = (category ? countries : await activeCountries()).map((country) => country.name);
  const cityOptions = (await citiesWithCountry()).filter((city) => countryOptions.includes(city.country));
  return { countryOptions, cityOptions };
}
