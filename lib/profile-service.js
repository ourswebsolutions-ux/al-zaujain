// Handles a multipart profile submission or edit: validate everything first, then write.
import { canEditProfile } from './access.js';
import { clientIp } from './auth.js';
import { getDb } from './db.js';
import { sendTemplate, siteUrl } from './mail.js';
import { profileCode } from './format.js';
import { validateProfile } from './profile-schema.js';
import { addPhoto, attachCnic, createProfile, profilePhotos, recropProfilePhoto, removePhoto, updateProfile } from './profiles.js';
import { PROFILE_TYPES } from './restrictions.js';
import { logActivity, randomToken, rateLimit, sha256 } from './security.js';
import { notify } from './notifications.js';
import { deleteCnicFile, deletePhotoFile, MAX_PHOTOS, saveCnic, savePhoto, UploadError } from './uploads.js';

function readFiles(form) {
  const photos = form.getAll('photos').filter((file) => typeof file === 'object' && file.size > 0);
  // One crop per photo, in the same order ("" when none was chosen).
  const crops = form.getAll('photo_crop').map(String);
  const front = form.get('cnic_front');
  const back = form.get('cnic_back');
  return { photos, crops, front: front?.size > 0 ? front : null, back: back?.size > 0 ? back : null };
}

async function storeFiles({ photos, crops = [], front, back }) {
  const saved = { photos: [], front: null, back: null };
  try {
    for (const [index, photo] of photos.entries()) saved.photos.push(await savePhoto(photo, `Photo ${index + 1}`, crops[index] || null));
    if (front) saved.front = await saveCnic(front, 'CNIC front');
    if (back) saved.back = await saveCnic(back, 'CNIC back');
    return saved;
  } catch (error) {
    for (const photo of saved.photos) { deletePhotoFile(photo.file); deletePhotoFile(photo.thumb); }
    deleteCnicFile(saved.front);
    deleteCnicFile(saved.back);
    throw error;
  }
}

function parseData(form) {
  try {
    return JSON.parse(form.get('data'));
  } catch {
    throw new UploadError('The form could not be read. Please try again.');
  }
}

// Settings only an administrator may give a profile. Anything a member sends here is ignored.
async function adminFields(form, user, { creating }) {
  if (user?.role !== 'admin') return null;
  const type = String(form.get('access_type') ?? '');
  const fields = {
    access_type: PROFILE_TYPES.includes(type) ? type : 'paid',
    extra_info: String(form.get('extra_info') ?? '').trim().slice(0, 10000) || null,
  };
  if (creating) {
    const hash = String(form.get('import_hash') ?? '');
    fields.import_hash = /^[0-9a-f]{64}$/.test(hash) ? hash : null;
    fields.source = 'admin';
  }
  return fields;
}

// The same pasted biodata, or the same person, already on file.
export async function findDuplicates({ hash, phone, name, dob }, excludeId = null) {
  const or = [];
  if (hash) or.push({ import_hash: hash });
  if (phone) or.push({ contact_phone: phone });
  if (name && dob) or.push({ full_name: name, date_of_birth: new Date(`${dob}T00:00:00Z`) });
  if (or.length === 0) return [];
  const rows = await getDb().profile.findMany({ where: { OR: or, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true, full_name: true, status: true }, take: 5 });
  return rows.map((row) => ({ code: profileCode(row.id), name: row.full_name, status: row.status }));
}

export async function submitNewProfile(form, user) {
  const admin = await adminFields(form, user, { creating: true });
  const validation = validateProfile(parseData(form), { admin: !!admin });
  if (!validation.ok) return { ok: false, status: 422, message: 'Please correct the highlighted fields.', errors: validation.errors };
  if (admin) return createByAdmin(form, user, admin, validation.data);
  if (form.get('consent') !== 'yes') return { ok: false, status: 422, message: 'Please confirm the consent statement.', errors: { consent: 'Please confirm to continue.' } };

  const files = readFiles(form);
  if (files.photos.length > MAX_PHOTOS) return { ok: false, status: 422, message: `You can upload up to ${MAX_PHOTOS} photos.` };
  if (files.back && !files.front) return { ok: false, status: 422, message: 'Please upload the front of the CNIC as well.' };

  const saved = await storeFiles(files);
  const token = randomToken();
  const isStaff = user && user.role !== 'user';
  const id = await createProfile(validation.data, { userId: user?.role === 'user' ? user.id : null, manageTokenHash: sha256(token) });
  if (form.get('photo_public') === 'no') await setPhotoPublic(id, false);
  for (const photo of saved.photos) await addPhoto(id, photo);
  if (saved.front) await attachCnic(id, saved.front, saved.back);
  await logActivity(user?.id, 'profile_submitted', profileCode(id), isStaff ? 'staff' : null);

  const code = profileCode(id);
  const email = validation.data.contact_email;
  const name = validation.data.full_name;
  await notify(user?.role === 'user' ? user.id : null, { type: 'profile', title: `Profile ${code} received`, body: 'Our team will review it shortly.', href: '/dashboard/profile' });
  await sendTemplate('profile_submitted', email, { name, code, manage_url: `${siteUrl()}/manage/${token}` });
  if (saved.front) await sendTemplate('verification_pending', email, { name, code });
  return { ok: true, code, url: `/manage/${token}`, id };
}

// Profiles the team adds: no consent step and no emails to the candidate, and they can go live at once.
async function createByAdmin(form, user, admin, data) {
  const duplicates = await findDuplicates({ hash: admin.import_hash, phone: data.contact_phone, name: data.full_name, dob: data.date_of_birth });
  if (duplicates.length && form.get('confirm_duplicate') !== 'yes') {
    return { ok: false, status: 409, message: 'This profile looks like one already on file. Check it, then confirm to save anyway.', duplicates };
  }
  const files = readFiles(form);
  if (files.photos.length > MAX_PHOTOS) return { ok: false, status: 422, message: `You can upload up to ${MAX_PHOTOS} photos.` };
  if (files.back && !files.front) return { ok: false, status: 422, message: 'Please upload the front of the CNIC as well.' };
  const saved = await storeFiles(files);
  const publish = form.get('publish') === 'yes';
  const id = await createProfile(data, { manageTokenHash: sha256(randomToken()), status: publish ? 'approved' : 'pending' });
  await getDb().profile.update({ where: { id }, data: admin });
  if (form.get('photo_public') === 'no') await setPhotoPublic(id, false);
  for (const photo of saved.photos) await addPhoto(id, photo);
  if (saved.front) await attachCnic(id, saved.front, saved.back);
  await logActivity(user.id, 'profile_created_by_admin', profileCode(id), `${admin.access_type}${publish ? ', published' : ''}`);
  return { ok: true, code: profileCode(id), url: `/admin/profiles/${profileCode(id)}`, id };
}

const setPhotoPublic = (id, value) => getDb().profile.update({ where: { id }, data: { photo_public: value } });

export async function editProfile(form, profile, { actor, reviewRequired }) {
  const admin = await adminFields(form, actor, { creating: false });
  const validation = validateProfile(parseData(form), { admin: !!admin });
  if (!validation.ok) return { ok: false, status: 422, message: 'Please correct the highlighted fields.', errors: validation.errors };

  const files = readFiles(form);
  const removeIds = form.getAll('remove_photo').map(Number).filter(Boolean);
  const remaining = (await profilePhotos(profile.id)).filter((photo) => !removeIds.includes(photo.id)).length;
  if (remaining + files.photos.length > MAX_PHOTOS) return { ok: false, status: 422, message: `You can keep up to ${MAX_PHOTOS} photos.` };
  if (files.back && !files.front) return { ok: false, status: 422, message: 'Please upload the front of the CNIC as well.' };

  const saved = await storeFiles(files);
  await updateProfile(profile.id, validation.data, { reviewRequired });
  await setPhotoPublic(profile.id, form.get('photo_public') !== 'no');
  if (admin) await getDb().profile.update({ where: { id: profile.id }, data: admin });
  for (const photoId of removeIds) await removePhoto(profile.id, photoId);
  // "Adjust card photo" on photos already on file: "<photo id>|<crop>".
  for (const entry of form.getAll('recrop').map(String)) {
    const [photoId, crop] = [Number(entry.split('|')[0]), entry.slice(entry.indexOf('|') + 1)];
    if (photoId && !removeIds.includes(photoId)) await recropProfilePhoto(profile.id, photoId, crop);
  }
  for (const photo of saved.photos) await addPhoto(profile.id, photo);
  if (saved.front) {
    await attachCnic(profile.id, saved.front, saved.back);
    await sendTemplate('verification_pending', validation.data.contact_email, { name: validation.data.full_name, code: profileCode(profile.id) });
  }
  await logActivity(actor?.id, 'profile_edited', profileCode(profile.id));
  return { ok: true, code: profileCode(profile.id) };
}

// A submission from the website form or the mobile app. Visitors without an account are rate limited.
export async function submitProfileRequest(form, user) {
  if (!user && !(await rateLimit(`profile:${await clientIp()}`, 5, 3600))) return { ok: false, status: 429, message: 'Too many submissions from this connection. Please try again later.' };
  if (form.get('website')) return { ok: false, status: 400, message: 'Submission rejected.' };
  return submitNewProfile(form, user);
}

// An edit by the owner, by staff, or by anyone holding the profile's private manage link.
// Staff edits stay live; every other edit goes back to the team for review.
export async function editProfileRequest(form, profile, user) {
  const token = form.get('manage_token');
  const tokenAllowed = typeof token === 'string' && !!token && profile.manage_token_hash === sha256(token);
  if (!tokenAllowed && !(await canEditProfile(user, profile))) return { ok: false, status: 403, message: 'You cannot edit this profile.' };
  const staffEdit = !tokenAllowed && user.role !== 'user';
  const result = await editProfile(form, profile, { actor: user, reviewRequired: !staffEdit });
  return result.ok ? { ...result, reviewRequired: !staffEdit } : result;
}
