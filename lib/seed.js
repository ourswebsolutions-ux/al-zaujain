// Reference data every installation starts with. Safe to run repeatedly.
import { getDb } from './db.js';
import { slugify } from './format.js';
import { CATEGORIES, EMAIL_TEMPLATES, FAQS, FEATURED_CITIES, OTHER_COUNTRIES, SETTINGS } from './seed-data.js';

export async function seedBaseData() {
  const db = getDb();
  await db.setting.createMany({ data: Object.entries(SETTINGS).map(([key, value]) => ({ key, value })), skipDuplicates: true });
  await db.emailTemplate.createMany({ data: EMAIL_TEMPLATES, skipDuplicates: true });
  if ((await db.category.count()) > 0) return;

  const addPlaces = async (categoryId, countries) => {
    for (const [index, [name, cities]] of Object.entries(countries).entries()) {
      await db.country.create({
        data: {
          name, slug: slugify(name), sort: index, category_id: categoryId,
          cities: { create: cities.map((city) => ({ name: city, slug: slugify(city), featured: FEATURED_CITIES.includes(city) })) },
        },
      });
    }
  };
  for (const [index, category] of CATEGORIES.entries()) {
    const { id } = await db.category.create({ data: { slug: category.slug, name: category.name, name_ur: category.name_ur, description: category.description, sort: index } });
    await addPlaces(id, category.countries);
  }
  await addPlaces(null, OTHER_COUNTRIES);
  await db.faq.createMany({ data: FAQS.map((faq, index) => ({ ...faq, sort: index })) });
}
