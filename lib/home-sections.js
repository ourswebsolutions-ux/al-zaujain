// Everything the homepage shows, built once and used by both the website and the mobile app, so the
// two always list the same proposals, consultants and director.
import { publicConsultants } from './consultants.js';
import { getFees } from './fees.js';
import { slugify } from './format.js';
import { getBanners, getDirector, imageSrc, proposalTab } from './homepage.js';
import { activeCategories, featuredCities } from './places.js';
import { SECOND_MARRIAGE } from './search.js';

const OVERSEAS = ['united-kingdom', 'united-states', 'europe', 'other-countries'];
const GULF = [['United Arab Emirates', 'UAE'], ['Saudi Arabia', 'Saudi Arabia'], ['Qatar', 'Qatar'], ['Oman', 'Oman'], ['Kuwait', 'Kuwait'], ['Bahrain', 'Bahrain']];

// Until the administrator adds banners, the homepage shows this photograph on its own.
export const DEFAULT_BANNER = { id: 'default', src: '/images/pakistani-couple.png', position: 'object-[60%_32%]', showText: false };

// Each tab: its profiles and the full list it opens. Tabs without proposals are left out, except the first.
async function buildTabs(specs) {
  const tabs = await Promise.all(specs.map(async ({ where, ...spec }) => ({ ...spec, profiles: await proposalTab(where) })));
  return tabs.filter((tab, index) => index === 0 || tab.profiles.length > 0);
}

export async function homeSections() {
  const [fees, director, categories, cities, consultants, stored] = await Promise.all([getFees(), getDirector(), activeCategories(), featuredCities(), publicConsultants(), getBanners({ activeOnly: true })]);
  const banners = stored.map((banner) => ({ ...banner, src: imageSrc(banner.image, 2200), mobileSrc: imageSrc(banner.mobileImage, 900) }));
  const live = new Set(categories.map((category) => category.slug));
  const inCategory = (slug) => ({ country: { category: { slug } } });

  const [pakistan, overseas, gulf, second] = await Promise.all([
    live.has('pakistan') ? buildTabs([
      { key: 'all', label: 'Pakistan', href: '/proposals/pakistan', where: inCategory('pakistan') },
      ...cities.map((city) => ({ key: city, label: city, href: `/proposals/pakistan/${slugify(city)}`, where: { ...inCategory('pakistan'), city } })),
    ]) : [],
    buildTabs([
      { key: 'all', label: 'Overseas', href: '/proposals', where: { country: { category: { slug: { in: OVERSEAS.filter((slug) => live.has(slug)) } } } } },
      ...(live.has('united-kingdom') ? [{ key: 'uk', label: 'UK', href: '/proposals/united-kingdom', where: inCategory('united-kingdom') }] : []),
      ...(live.has('united-states') ? [{ key: 'usa', label: 'USA', href: '/proposals/united-states', where: inCategory('united-states') }] : []),
      ...(live.has('other-countries') ? [
        { key: 'canada', label: 'Canada', href: '/proposals/other-countries/canada', where: { country: { name: 'Canada' } } },
        { key: 'australia', label: 'Australia', href: '/proposals/other-countries/australia', where: { country: { name: 'Australia' } } },
      ] : []),
      ...(live.has('europe') ? [{ key: 'europe', label: 'Europe', href: '/proposals/europe', where: inCategory('europe') }] : []),
    ]),
    live.has('gulf') ? buildTabs([
      { key: 'all', label: 'Gulf', href: '/proposals/gulf', where: inCategory('gulf') },
      ...GULF.map(([name, label]) => ({ key: slugify(name), label, href: `/proposals/gulf/${slugify(name)}`, where: { country: { name } } })),
    ]) : [],
    // Second marriage: both tabs always show, so families know where to look.
    Promise.all([
      { key: 'seeking', label: 'Seeking', tabLabel: 'Looking For A Second Marriage', intro: 'Divorced, widowed or separated women looking for a second marriage.', href: '/proposals?second=seeking', where: SECOND_MARRIAGE.seeking, links: [{ label: 'View All', href: '/proposals?second=seeking' }] },
      { key: 'wife', label: 'Second wife', tabLabel: 'Willing To Be A Second Wife', intro: 'Women who have said in their profile that they are willing to be a second wife.', href: '/proposals?second=wife', where: SECOND_MARRIAGE.wife, links: [{ label: 'View All', href: '/proposals?second=wife' }] },
    ].map(async ({ where, ...tab }) => ({ ...tab, profiles: await proposalTab(where) }))),
  ]);

  const sections = [
    { id: 'pakistan-proposals', title: 'Pakistan', highlight: 'Proposals', intro: 'See the newest {place} proposals (rishtay). Find your life partner with Al Zaujain.', tabs: pakistan },
    { id: 'overseas-proposals', title: 'Overseas', highlight: 'Proposals', intro: 'See the newest {place} proposals (rishtay) from Pakistani families abroad.', tabs: overseas },
    { id: 'gulf-proposals', title: 'Gulf', highlight: 'Proposals', intro: 'See the newest {place} proposals (rishtay) from UAE, Saudi Arabia, Qatar, Oman and the Gulf.', tabs: gulf },
    { id: 'second-marriage-proposals', title: 'Second Marriage', highlight: 'Proposals', intro: '', tabs: second },
  ].filter((section) => section.tabs.length > 0);

  return { banners: banners.length > 0 ? banners : [DEFAULT_BANNER], sections, director: { ...director, photoSrc: imageSrc(director.photo, 900) }, consultants, fees };
}
