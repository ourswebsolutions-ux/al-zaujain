import { getDb } from '@/lib/db.js';
import { profileCode } from '@/lib/format.js';
import { activeCategories, countriesInCategory } from '@/lib/places.js';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const db = getDb();
  const paths = ['', '/proposals', '/consultants', '/submit-profile', '/register', '/privacy', '/terms'].map((path) => ({ url: `${base}${path}` }));
  for (const category of await activeCategories()) {
    paths.push({ url: `${base}/proposals/${category.slug}` });
    const countries = await countriesInCategory(category.id);
    if (countries.length > 1) for (const country of countries) paths.push({ url: `${base}/proposals/${category.slug}/${country.slug}` });
  }
  for (const consultant of await db.consultant.findMany({ where: { is_public: true }, select: { slug: true } })) paths.push({ url: `${base}/consultants/${consultant.slug}` });
  const profiles = await db.profile.findMany({ where: { status: 'approved' }, select: { id: true, updated_at: true } });
  for (const { id, updated_at } of profiles) paths.push({ url: `${base}/profile/${profileCode(id)}`, lastModified: updated_at });
  return paths;
}
