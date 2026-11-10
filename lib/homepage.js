// The homepage's editable parts: the hero banners and the director section. Both live in the
// settings table as JSON, so no database change is needed. Images are stored under uploads/homepage
// and served by /media/homepage/<file>.
import { cloudinaryVariant, isCloudinaryUrl } from './cloudinary.js';
import { getDb } from './db.js';
import { getSetting, saveSettings } from './settings.js';

const text = (value, max) => String(value ?? '').trim().slice(0, max);
// Buttons may lead inside the site ("/proposals") or to http(s), WhatsApp or phone links only.
export const safeHref = (value) => {
  const href = text(value, 300);
  if (!href) return '';
  if (/^\/(?!\/)/.test(href) || /^#[\w-]+$/.test(href)) return href;
  if (/^(https?:\/\/|tel:|mailto:)/i.test(href)) return href;
  return '';
};

// A stored image is a Cloudinary address or a file under uploads/homepage.
export const storedImage = (value) => (isCloudinaryUrl(value) || /^[\w-]+\.webp$/.test(value ?? '') ? value : null);
export const imageSrc = (value, width) => {
  if (!value) return null;
  return isCloudinaryUrl(value) ? cloudinaryVariant(value, width) : `/media/homepage/${value}`;
};

const percent = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number * 10) / 10)) : fallback;
};
const oneOf = (value, list) => (list.includes(value) ? value : list[0]);

function cleanBanner(banner) {
  return {
    id: text(banner?.id, 40) || crypto.randomUUID(),
    image: storedImage(banner?.image),
    mobileImage: storedImage(banner?.mobileImage),
    // Text is optional: by default a banner is the image alone. When it is on, the administrator
    // places it by dragging it on a preview; the position is kept as percentages of the banner.
    showText: banner?.showText === true,
    textX: percent(banner?.textX, 8),
    textY: percent(banner?.textY, 50),
    textAlign: oneOf(banner?.textAlign, ['start', 'center', 'end']),
    textTheme: oneOf(banner?.textTheme, ['light', 'dark']),
    textSize: oneOf(banner?.textSize, ['md', 'lg', 'sm']),
    shade: oneOf(banner?.shade, ['soft', 'none', 'strong']),
    eyebrow: text(banner?.eyebrow, 80),
    heading: text(banner?.heading, 140),
    urdu: text(banner?.urdu, 140),
    text: text(banner?.text, 320),
    cta: text(banner?.cta, 40),
    href: safeHref(banner?.href),
    cta2: text(banner?.cta2, 40),
    href2: safeHref(banner?.href2),
    active: banner?.active !== false,
  };
}

async function readJson(key, fallback) {
  try {
    const value = JSON.parse((await getSetting(key)) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getBanners({ activeOnly = false } = {}) {
  const list = (await readJson('home_banners', [])).map(cleanBanner);
  return activeOnly ? list.filter((banner) => banner.active && banner.image) : list;
}

export async function saveBanners(list) {
  await saveSettings({ home_banners: JSON.stringify(list.map(cleanBanner).slice(0, 12)) });
}

export const DEFAULT_DIRECTOR = {
  name: 'Muhammad Asif Raza',
  title: 'Director & CEO, Al Zaujain Marriage Bureau',
  summary: 'Founder of Al Zaujain Marriage Bureau, Multan, a registered matrimonial service helping Pakistani families at home and overseas find suitable rishtay.',
  bio: 'Muhammad Asif Raza leads Al Zaujain with one principle: every family deserves honest guidance, privacy and respect. Under his direction the bureau works personally with each family, checks every proposal carefully and stays involved until both sides are confident.\n\nAl Zaujain is registered with FBR (NTN 8052006-4) and serves families in Pakistan, the Gulf, the UK, Europe, North America and Australia.',
  photo: null,
  cta: 'Contact the Director',
  href: '',
};

export async function getDirector() {
  const stored = await readJson('home_director', null);
  const value = { ...DEFAULT_DIRECTOR, ...(stored ?? {}) };
  return {
    name: text(value.name, 100),
    title: text(value.title, 140),
    summary: text(value.summary, 400),
    bio: text(value.bio, 2000),
    photo: storedImage(value.photo),
    cta: text(value.cta, 40),
    href: safeHref(value.href),
  };
}

export const saveDirector = (value) => saveSettings({ home_director: JSON.stringify(value) });

// Profiles for the homepage's proposal sections, by tab. Only approved profiles, only card fields.
export async function proposalTab(where, take = 6) {
  const { CARD_SELECT, toCard } = await import('./profiles.js');
  const rows = await getDb().profile.findMany({
    where: { status: 'approved', ...where },
    select: CARD_SELECT,
    orderBy: [{ featured: 'desc' }, { approved_at: 'desc' }, { id: 'desc' }],
    take,
  });
  return rows.map(toCard);
}
