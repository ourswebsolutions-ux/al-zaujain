// Mobile API: everything a visitor can see or do without signing in.
import { appRelease } from '../app-release.js';
import { clientIp } from '../auth.js';
import { consultantBySlug, publicConsultants } from '../consultants.js';
import { activeFaqs, WHATSAPP_CHANNEL } from '../content.js';
import { savedCodes } from '../engagement.js';
import { submitEnquiryValues } from '../enquiries.js';
import { idFromCode } from '../format.js';
import { PATTERNS, UR } from '../i18n/ur.js';
import { PRIVACY, TERMS } from '../legal.js';
import { compatibleProfiles, similarProfiles } from '../matching.js';
import { activeCategories, activeCountries, casteOptions, citiesWithCountry, featuredCities, nationalityOptions } from '../places.js';
import { HEIGHTS, MARRIAGE_LOCATIONS, SECTIONS, validateStep } from '../profile-schema.js';
import { profileView } from '../profile-view.js';
import { carouselProfiles, getProfile } from '../profiles.js';
import { resolveScope, scopePlaces, scopeTabs } from '../proposal-scope.js';
import { getRestrictions, RESTRICTIONS } from '../restrictions.js';
import { parseFilters, searchProfiles, SORTS } from '../search.js';
import { getSettings } from '../settings.js';
import { MAX_PHOTOS } from '../uploads.js';
import { API_VERSION, fail, readJson } from './core.js';

// Only these settings are public. SMTP details, the admin's email and the like never leave the server.
const PUBLIC_SETTINGS = ['site_phone', 'site_phone_intl', 'site_whatsapp', 'site_location', 'hero_eyebrow', 'hero_line1', 'hero_line2', 'hero_highlight', 'hero_sub1', 'hero_sub2', 'hero_urdu', 'registration_authority', 'registration_number', 'registration_note', 'footer_about', 'access_price', 'chat_enabled'];

const optionList = (options) => options.map((option) => (Array.isArray(option) ? { value: String(option[0]), label: String(option[1]) } : { value: String(option), label: String(option) }));

// The profile form exactly as the website defines it, so the app's forms follow any change.
const formSchema = () => SECTIONS.map((section) => ({
  key: section.key,
  title: section.title,
  ur: section.ur,
  fields: section.fields.map((field) => ({ ...field, options: field.options ? optionList(field.options) : undefined })),
}));

export async function config() {
  const settings = await getSettings();
  const restrictions = await getRestrictions();
  const site = Object.fromEntries(PUBLIC_SETTINGS.map((key) => [key, settings[key] ?? '']));
  return {
    app: 'al-zaujain',
    api: API_VERSION,
    site: {
      ...site,
      announcements: (settings.announcements ?? '').split('\n').map((line) => line.trim()).filter(Boolean),
      whatsapp_channel: WHATSAPP_CHANNEL,
      chat_enabled: settings.chat_enabled === '1',
    },
    categories: (await activeCategories()).map(({ id, slug, name, name_ur, description }) => ({ id, slug, name, name_ur, description })),
    countries: await activeCountries(),
    cities: await citiesWithCountry(),
    featuredCities: await featuredCities(),
    castes: await casteOptions(),
    nationalities: await nationalityOptions(),
    marriageLocations: MARRIAGE_LOCATIONS,
    heights: HEIGHTS.map(([cm, label]) => ({ value: cm, label })),
    sorts: Object.entries(SORTS).map(([key, sort]) => ({ key, label: sort.label })),
    form: formSchema(),
    maxPhotos: MAX_PHOTOS,
    restrictions: RESTRICTIONS.map((item) => ({ key: item.key, label: item.label, text: item.text, on: restrictions[item.key] })),
    legal: { privacy: PRIVACY, terms: TERMS },
    release: appRelease(),
  };
}

// The website's Urdu wording, so the app shows the very same translations.
export function i18n() {
  return { ur: UR, patterns: PATTERNS.map(([pattern, template]) => [pattern.source, template]) };
}

export async function home({ user }) {
  return {
    profiles: await carouselProfiles(),
    faqs: (await activeFaqs()).map(({ id, question, answer, answer_ur }) => ({ id, question, answer, answer_ur })),
    saved: user?.role === 'user' ? [...(await savedCodes(user.id))] : [],
  };
}

// /proposals, /proposals/<region>, /proposals/<region>/<country or city>, with the same filters.
export async function proposals({ query, user }) {
  const slug = (query.get('path') ?? '').split('/').map((part) => part.trim()).filter(Boolean);
  const resolved = await resolveScope(slug);
  if (!resolved) fail('This list of proposals was not found.', 404);
  const filters = parseFilters(Object.fromEntries(query.entries()));
  const results = await searchProfiles(filters, resolved.scope);
  const { countryOptions, cityOptions } = await scopePlaces(resolved);
  return {
    title: resolved.title,
    path: resolved.path,
    category: resolved.category ? { slug: resolved.category.slug, name: resolved.category.name, name_ur: resolved.category.name_ur, description: resolved.category.description } : null,
    tabs: await scopeTabs(resolved),
    countries: countryOptions,
    cities: cityOptions,
    filters,
    ...results,
    saved: user?.role === 'user' ? [...(await savedCodes(user.id))] : [],
  };
}

const photoUrl = (file) => `/media/photos/${file}`;

export async function profile({ params, user }) {
  const row = await getProfile(idFromCode(params.code));
  const view = await profileView(row, user, await clientIp());
  if (!view) fail('This proposal is not available.', 404);
  return {
    profile: {
      code: view.label,
      name: row.display_name,
      city: row.city,
      country: row.country_name,
      category: row.category_slug,
      type: row.access_type,
      photoPublic: row.photo_public,
      status: row.status,
    },
    biodata: view.data,
    photos: view.photos.map((photo) => ({ id: photo.id, file: photoUrl(photo.file), thumb: photoUrl(photo.thumb) })),
    photoLocked: view.photoLocked,
    locks: view.locks,
    lockedContact: view.contact.locked,
    isOwner: view.isOwner,
    live: view.live,
    canChat: view.canChat,
    canSave: view.canSave,
    saved: view.saved,
    yourScore: view.yourScore,
    whatsapp: view.whatsapp,
    premiumWhatsapp: view.premiumWhatsapp,
    compatible: view.live ? await compatibleProfiles(row) : [],
    similar: view.live ? await similarProfiles(row) : [],
  };
}

const PUBLIC_CONSULTANT = ({ id, slug, display_name, photo, title, bio, phone, whatsapp, public_email, city, languages, experience_years }) => ({
  id, slug, display_name, photo: photo ? `/media/consultants/${photo}` : null, title, bio, phone, whatsapp, public_email, city, languages, experience_years,
});

export async function consultants() {
  return { consultants: (await publicConsultants()).map(PUBLIC_CONSULTANT) };
}

export async function consultant({ params }) {
  const row = await consultantBySlug(params.slug);
  if (!row) fail('This consultant was not found.', 404);
  return { consultant: PUBLIC_CONSULTANT(row) };
}

// The website's contact form.
export async function enquiry({ request }) {
  const body = await readJson(request);
  const result = await submitEnquiryValues((key) => body[key], { source: 'mobile app' });
  if (!result.ok) fail(result.message, 422);
  return { message: result.message };
}

// Checks one step of the profile form with the website's own rules.
export async function validateFormStep({ request }) {
  const body = await readJson(request);
  if (!SECTIONS.some((section) => section.key === body.section)) fail('Unknown form step.', 422);
  const errors = validateStep(body.section, body.values ?? {});
  return { errors, valid: Object.keys(errors).length === 0 };
}
