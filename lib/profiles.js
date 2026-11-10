import { getDb } from './db.js';
import { ageFromDob, firstName, profileCode } from './format.js';
import { COLUMN_NAMES } from './profile-schema.js';
import { deleteCnicFile, deletePhotoFile, recropPhoto } from './uploads.js';

const PHOTO_ORDER = [{ is_primary: 'desc' }, { sort: 'asc' }];

export const CARD_SELECT = {
  id: true, display_name: true, date_of_birth: true, city: true, education_level: true, degree: true, occupation: true, marital_status: true,
  verification_status: true, photo_public: true, access_type: true,
  country: { select: { name: true } },
  photos: { select: { thumb: true }, orderBy: PHOTO_ORDER, take: 1 },
};

// The only shape listings, cards and match sections ever receive, so private data cannot leak.
export function toCard(row) {
  return {
    code: profileCode(row.id),
    name: row.display_name,
    age: ageFromDob(row.date_of_birth),
    city: row.city,
    country: row.country?.name ?? null,
    education: row.degree || row.education_level,
    profession: row.occupation,
    maritalStatus: row.marital_status,
    verified: row.verification_status === 'verified',
    photo: row.photo_public ? row.photos?.[0]?.thumb ?? null : null,
    type: row.access_type ?? 'paid',
  };
}

export async function featuredProfiles(limit = 4) {
  const rows = await getDb().profile.findMany({ where: { status: 'approved', featured: true }, select: CARD_SELECT, orderBy: [{ featured_sort: 'asc' }, { id: 'asc' }], take: limit });
  return rows.map(toCard);
}

// The homepage carousel: featured proposals first, then the newest, in all three profile types.
export async function carouselProfiles(limit = 12) {
  const db = getDb();
  const featured = await db.profile.findMany({ where: { status: 'approved', featured: true }, select: CARD_SELECT, orderBy: [{ featured_sort: 'asc' }, { id: 'asc' }], take: limit });
  const latest = await db.profile.findMany({ where: { status: 'approved', featured: false }, select: CARD_SELECT, orderBy: [{ approved_at: 'desc' }, { id: 'desc' }], take: Math.max(0, limit - featured.length) });
  return [...featured.map((row) => ({ ...toCard(row), featured: true })), ...latest.map(toCard)];
}

const WITH_PLACE = { country: { select: { name: true, category: { select: { slug: true, name: true } } } } };

export function flattenProfile(row) {
  if (!row) return null;
  const { country, ...profile } = row;
  return { ...profile, country_name: country?.name ?? null, category_slug: country?.category?.slug ?? null, category_name: country?.category?.name ?? null };
}

export const getProfile = async (id) => (id ? flattenProfile(await getDb().profile.findUnique({ where: { id }, include: WITH_PLACE })) : null);

export const profileByManageToken = async (tokenHash) => flattenProfile(await getDb().profile.findUnique({ where: { manage_token_hash: tokenHash }, include: WITH_PLACE }));

export const profilePhotos = (profileId) => getDb().profilePhoto.findMany({ where: { profile_id: profileId }, orderBy: PHOTO_ORDER });

// Public fields only: this column is what the search box looks through.
export function buildSearchText(data, countryName) {
  return [firstName(data.full_name), data.caste, data.city, countryName, data.education_level, data.degree, data.occupation, data.job_title, data.religion, data.sect, data.nationality, data.marriage_location].filter(Boolean).join(' ');
}

async function columnsFrom(data) {
  const country = data.country_id ? await getDb().country.findUnique({ where: { id: data.country_id }, select: { name: true } }) : null;
  const values = Object.fromEntries(COLUMN_NAMES.map((name) => [name, data[name] ?? null]));
  return {
    ...values,
    date_of_birth: new Date(`${data.date_of_birth}T00:00:00Z`),
    display_name: firstName(data.full_name),
    search_text: buildSearchText(data, country?.name),
  };
}

export async function createProfile(data, { userId = null, manageTokenHash = null, consultantId = null, status = 'pending', isDemo = false } = {}) {
  const profile = await getDb().profile.create({
    data: { ...(await columnsFrom(data)), user_id: userId, manage_token_hash: manageTokenHash, consultant_id: consultantId, status, is_demo: isDemo, approved_at: status === 'approved' ? new Date() : null },
    select: { id: true },
  });
  return profile.id;
}

// Editing a live profile sends it back for review unless staff made the edit.
export async function updateProfile(id, data, { reviewRequired = true } = {}) {
  await getDb().profile.update({ where: { id }, data: { ...(await columnsFrom(data)), ...(reviewRequired ? { status: 'pending', rejection_reason: null } : {}) } });
}

export async function deleteProfile(id) {
  const db = getDb();
  const [photos, document] = await Promise.all([db.profilePhoto.findMany({ where: { profile_id: id } }), db.cnicDocument.findUnique({ where: { profile_id: id } })]);
  await db.profile.delete({ where: { id } });
  for (const photo of photos) {
    deletePhotoFile(photo.file);
    deletePhotoFile(photo.thumb);
  }
  if (document) {
    deleteCnicFile(document.front_file);
    deleteCnicFile(document.back_file);
  }
}

export async function addPhoto(profileId, { file, thumb }) {
  const db = getDb();
  const count = await db.profilePhoto.count({ where: { profile_id: profileId } });
  await db.profilePhoto.create({ data: { profile_id: profileId, file, thumb, is_primary: count === 0, sort: count } });
}

// Replaces a photo's card picture with the part the owner chose. The full photo is untouched.
export async function recropProfilePhoto(profileId, photoId, crop) {
  const db = getDb();
  const photo = await db.profilePhoto.findFirst({ where: { id: photoId, profile_id: profileId } });
  if (!photo) return false;
  const thumb = await recropPhoto(photo.file, crop);
  if (!thumb) return false;
  await db.profilePhoto.update({ where: { id: photo.id }, data: { thumb } });
  deletePhotoFile(photo.thumb);
  return true;
}

export async function removePhoto(profileId, photoId) {
  const db = getDb();
  const photo = await db.profilePhoto.findFirst({ where: { id: photoId, profile_id: profileId } });
  if (!photo) return;
  await db.profilePhoto.delete({ where: { id: photoId } });
  deletePhotoFile(photo.file);
  deletePhotoFile(photo.thumb);
  if (photo.is_primary) {
    const next = await db.profilePhoto.findFirst({ where: { profile_id: profileId }, orderBy: { sort: 'asc' } });
    if (next) await db.profilePhoto.update({ where: { id: next.id }, data: { is_primary: true } });
  }
}

// A new document replaces the old one and always restarts the review.
export async function attachCnic(profileId, frontFile, backFile) {
  const db = getDb();
  const previous = await db.cnicDocument.findUnique({ where: { profile_id: profileId } });
  await db.$transaction([
    db.cnicDocument.deleteMany({ where: { profile_id: profileId } }),
    db.cnicDocument.create({ data: { profile_id: profileId, front_file: frontFile, back_file: backFile } }),
    db.profile.update({ where: { id: profileId }, data: { verification_status: 'pending', verification_note: null } }),
  ]);
  if (previous) {
    deleteCnicFile(previous.front_file);
    deleteCnicFile(previous.back_file);
  }
}

// Verification can only be granted to a profile that holds a submitted document.
export async function setVerification(profileId, status, note, reviewerId) {
  const db = getDb();
  const document = await db.cnicDocument.findUnique({ where: { profile_id: profileId } });
  if (!document) throw new Error('This profile has no CNIC document on file.');
  await db.$transaction([
    db.profile.update({ where: { id: profileId }, data: { verification_status: status, verification_note: note ?? null } }),
    db.cnicDocument.update({ where: { profile_id: profileId }, data: { reviewed_by: reviewerId, reviewed_at: new Date() } }),
  ]);
}

export async function rebuildSearchText(where) {
  const db = getDb();
  const rows = await db.profile.findMany({ where, include: { country: { select: { name: true } } } });
  for (const row of rows) await db.profile.update({ where: { id: row.id }, data: { search_text: buildSearchText(row, row.country?.name) } });
}

export const rebuildSearchTextForCountry = (countryId) => rebuildSearchText({ country_id: countryId });
