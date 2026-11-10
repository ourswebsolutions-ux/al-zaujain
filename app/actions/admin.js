'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { idFromCode, profileCode, slugify } from '@/lib/format.js';
import { sendMatchEmails, sendTemplate, testSmtp } from '@/lib/mail.js';
import { deleteProfile, getProfile, rebuildSearchText, rebuildSearchTextForCountry, setVerification } from '@/lib/profiles.js';
import { notify } from '@/lib/notifications.js';
import { reviewProfile } from '@/lib/review.js';
import { PROFILE_TYPES } from '@/lib/restrictions.js';
import { encryptText, hashPassword, logActivity, randomToken } from '@/lib/security.js';
import { saveSettings } from '@/lib/settings.js';
import { deleteConsultantPhoto, saveConsultantPhoto, UploadError } from '@/lib/uploads.js';
import { readAudience, readCardFields } from '@/lib/consultants.js';

const refresh = () => revalidatePath('/', 'layout');
const text = (form, key) => String(form.get(key) ?? '').trim();
const flag = (form, key) => !!form.get(key);

// Profiles
export async function approveProfile(form) {
  const admin = await requireAdmin();
  await reviewProfile(Number(form.get('id')), 'approved', null, admin.id);
  refresh();
}

export async function rejectProfile(form) {
  const admin = await requireAdmin();
  await reviewProfile(Number(form.get('id')), 'rejected', text(form, 'reason'), admin.id);
  refresh();
}

// Unpublishing hides a live profile everywhere without losing its approval history.
export async function setPublished(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const publish = form.get('publish') === '1';
  const { count } = await getDb().profile.updateMany({ where: { id, status: publish ? { in: ['hidden', 'pending'] } : 'approved' }, data: publish ? { status: 'approved', approved_at: new Date(), rejection_reason: null } : { status: 'hidden', featured: false } });
  if (count) await logActivity(admin.id, publish ? 'profile_published' : 'profile_unpublished', profileCode(id));
  refresh();
}

export async function setProfileType(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const type = text(form, 'access_type');
  if (!PROFILE_TYPES.includes(type)) return;
  await getDb().profile.update({ where: { id }, data: { access_type: type } });
  await logActivity(admin.id, 'profile_type_changed', profileCode(id), type);
  refresh();
}

export async function removeProfile(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  await deleteProfile(id);
  await logActivity(admin.id, 'profile_deleted', profileCode(id));
  refresh();
  const next = text(form, 'next');
  redirect(next.startsWith('/admin/') ? next : '/admin/profiles');
}

export async function assignConsultant(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const consultantId = Number(form.get('consultant_id')) || null;
  const profile = await getDb().profile.update({ where: { id }, data: { consultant_id: consultantId }, select: { user_id: true, consultant: { select: { display_name: true } } } });
  if (profile.consultant) await notify(profile.user_id, { type: 'consultant', title: `${profile.consultant.display_name} is now your marriage consultant`, body: 'They will guide you through suitable proposals.', href: '/dashboard' });
  await logActivity(admin.id, 'consultant_assigned', profileCode(id), String(consultantId));
  refresh();
}

export async function setFeatured(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const featured = Number(form.get('featured')) === 1;
  await getDb().profile.updateMany({ where: { id, ...(featured ? { status: 'approved' } : {}) }, data: { featured, featured_sort: Number(form.get('sort')) || 100 } });
  await logActivity(admin.id, featured ? 'profile_featured' : 'profile_unfeatured', profileCode(id));
  refresh();
}

export async function addFeaturedByCode(_previous, form) {
  await requireAdmin();
  const profile = await getProfile(idFromCode(text(form, 'code').toUpperCase()));
  if (!profile) return { ok: false, message: 'No profile has that code.' };
  if (profile.status !== 'approved') return { ok: false, message: 'Only approved profiles can be featured.' };
  await getDb().profile.update({ where: { id: profile.id }, data: { featured: true } });
  refresh();
  return { ok: true, message: `${profileCode(profile.id)} is now featured.` };
}

// Verification
export async function reviewVerification(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const decision = form.get('decision') === 'verified' ? 'verified' : 'rejected';
  const note = text(form, 'note') || null;
  const profile = await getProfile(id);
  if (!profile) return;
  await setVerification(id, decision, note, admin.id);
  const code = profileCode(id);
  await sendTemplate(decision === 'verified' ? 'verification_approved' : 'verification_rejected', profile.contact_email, { name: profile.full_name, code, reason: note ?? 'The image was not clear enough.' });
  await notify(profile.user_id, decision === 'verified'
    ? { type: 'verification', title: 'Your profile is verified', body: 'The blue tick now appears beside your name.', href: '/dashboard/profile' }
    : { type: 'verification', title: 'Verification needs another look', body: (note ?? 'Please upload a clearer copy of your CNIC.').slice(0, 280), href: '/dashboard/edit' });
  await logActivity(admin.id, `verification_${decision}`, code);
  refresh();
}

// Users
async function removeUser(target) {
  const db = getDb();
  const profiles = await db.profile.findMany({ where: { user_id: target.id }, select: { id: true } });
  for (const { id } of profiles) await deleteProfile(id);
  const consultant = await db.consultant.findUnique({ where: { user_id: target.id } });
  if (consultant) deleteConsultantPhoto(consultant.photo);
  await db.user.delete({ where: { id: target.id } });
}

export async function updateUser(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const db = getDb();
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;
  const action = form.get('action');
  if (action === 'chat') {
    await db.user.update({ where: { id }, data: { chat_disabled: !target.chat_disabled } });
    await logActivity(admin.id, 'user_chat_toggled', `user:${id}`);
  } else if (action === 'status' && target.id !== admin.id) {
    const status = target.status === 'active' ? 'suspended' : 'active';
    await db.user.update({ where: { id }, data: { status } });
    if (status === 'suspended') await db.session.deleteMany({ where: { user_id: id } });
    await sendTemplate('account_status', target.email, { name: target.name, status });
    await logActivity(admin.id, `user_${status}`, `user:${id}`);
  } else if (action === 'delete' && target.id !== admin.id && target.role !== 'admin') {
    await removeUser(target);
    await logActivity(admin.id, 'user_deleted', `user:${id}`);
    refresh();
    redirect('/admin/users');
  }
  refresh();
}

const userSchema = z.object({
  name: z.string().trim().min(2, 'Please enter a name').max(100),
  email: z.email('Enter a valid email address').max(160),
  phone: z.string().trim().regex(/^[+0-9\s()-]{7,20}$/, 'Enter a valid phone number').or(z.literal('')),
});

const readUser = (form) => userSchema.safeParse({ name: text(form, 'name'), email: text(form, 'email').toLowerCase(), phone: text(form, 'phone') });

export async function createUser(_previous, form) {
  const admin = await requireAdmin();
  const parsed = readUser(form);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const role = form.get('role') === 'consultant' ? 'consultant' : 'user';
  const password = text(form, 'password') || randomToken(9);
  if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
  const db = getDb();
  const { name, email, phone } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: 'That email already has an account.' };
  let slug = slugify(name) || 'consultant';
  if (role === 'consultant' && await db.consultant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const user = await db.user.create({
    data: {
      email, name, phone: phone || null, role, password_hash: hashPassword(password),
      ...(role === 'consultant' ? { consultant: { create: { slug, display_name: name, phone: phone || null, public_email: email, city: text(form, 'city') || null } } } : {}),
    },
  });
  await logActivity(admin.id, role === 'consultant' ? 'consultant_created' : 'user_created', `user:${user.id}`);
  refresh();
  return { ok: true, id: user.id, message: 'Account created. Password: {password} (shown once)', password };
}

export async function saveUser(_previous, form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const parsed = readUser(form);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const db = getDb();
  const { name, email, phone } = parsed.data;
  const taken = await db.user.findUnique({ where: { email } });
  if (taken && taken.id !== id) return { ok: false, message: 'That email already has an account.' };
  await db.user.update({ where: { id }, data: { name, email, phone: phone || null } });
  await logActivity(admin.id, 'user_updated', `user:${id}`);
  refresh();
  return { ok: true, message: 'Your details have been saved.' };
}

export async function setUserPassword(_previous, form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const password = text(form, 'password') || randomToken(9);
  if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
  const db = getDb();
  await db.user.update({ where: { id }, data: { password_hash: hashPassword(password) } });
  await db.session.deleteMany({ where: { user_id: id } });
  await logActivity(admin.id, 'user_password_set', `user:${id}`);
  return { ok: true, message: 'New password: {password} (shown once)', password };
}

// Consultants
const consultantSchema = z.object({
  display_name: z.string().min(2, 'Name is required').max(100),
  title: z.string().max(120),
  bio: z.string().max(2000),
  phone: z.string().max(30),
  whatsapp: z.string().regex(/^\d{0,20}$/, 'WhatsApp must be digits only, in international format, e.g. 923001234567'),
  public_email: z.string().max(160),
  city: z.string().max(80),
  languages: z.string().max(160),
  experience_years: z.number().int().min(0).max(70).nullable(),
});

function readConsultant(form) {
  const years = text(form, 'experience_years');
  return consultantSchema.safeParse({
    display_name: text(form, 'display_name'), title: text(form, 'title'), bio: text(form, 'bio'), phone: text(form, 'phone'), whatsapp: text(form, 'whatsapp'),
    public_email: text(form, 'public_email'), city: text(form, 'city'), languages: text(form, 'languages'), experience_years: years ? Number(years) : null,
  });
}

const readPermissions = (form) => ({
  perm_edit: flag(form, 'perm_edit'), perm_review: flag(form, 'perm_review'),
  perm_contact: flag(form, 'perm_contact'), perm_chat: flag(form, 'perm_chat'), perm_proposals: flag(form, 'perm_proposals'),
});

async function photoFrom(form) {
  const file = form.get('photo');
  return file?.size > 0 ? saveConsultantPhoto(file) : null;
}

export async function createConsultant(_previous, form) {
  const admin = await requireAdmin();
  const parsed = readConsultant(form);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const email = text(form, 'email').toLowerCase();
  if (!z.email().safeParse(email).success) return { ok: false, message: 'Enter a valid login email.' };
  const password = text(form, 'password') || randomToken(9);
  if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
  const audience = readAudience(form);
  if (audience.error) return { ok: false, message: audience.error };
  const card = readCardFields(form);
  if (card.error) return { ok: false, message: card.error };
  const db = getDb();
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: 'That email already has an account.' };
  let photo = null;
  try {
    photo = await photoFrom(form);
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message };
    throw error;
  }
  const data = parsed.data;
  let slug = slugify(data.display_name) || 'consultant';
  if (await db.consultant.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  await db.user.create({
    data: {
      email, password_hash: hashPassword(password), name: data.display_name, phone: data.phone || null, role: 'consultant',
      consultant: { create: { ...data, ...readPermissions(form), ...audience, ...card, slug, photo } },
    },
  });
  await logActivity(admin.id, 'consultant_created', slug);
  refresh();
  return { ok: true, message: `Consultant created. Login: ${email} · Password: ${password} (shown once)` };
}

export async function saveConsultant(_previous, form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const db = getDb();
  const existing = await db.consultant.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: 'Consultant not found.' };
  const parsed = readConsultant(form);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const audience = readAudience(form);
  if (audience.error) return { ok: false, message: audience.error };
  const card = readCardFields(form);
  if (card.error) return { ok: false, message: card.error };
  let photo = existing.photo;
  try {
    const uploaded = await photoFrom(form);
    if (uploaded) {
      deleteConsultantPhoto(existing.photo);
      photo = uploaded;
    }
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message };
    throw error;
  }
  await db.consultant.update({ where: { id }, data: { ...parsed.data, ...readPermissions(form), ...audience, ...card, photo } });
  await logActivity(admin.id, 'consultant_updated', existing.slug);
  refresh();
  return { ok: true, message: 'Consultant saved.' };
}

export async function deleteConsultant(form) {
  const admin = await requireAdmin();
  const db = getDb();
  const consultant = await db.consultant.findUnique({ where: { id: Number(form.get('id')) } });
  if (!consultant) return;
  deleteConsultantPhoto(consultant.photo);
  await db.user.delete({ where: { id: consultant.user_id } });
  await logActivity(admin.id, 'consultant_deleted', consultant.slug);
  refresh();
  redirect('/admin/consultants');
}

// Locations and categories
export async function saveCategory(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const name = text(form, 'name');
  if (!name) return;
  const values = { name, name_ur: text(form, 'name_ur') || null, description: text(form, 'description') || null, sort: Number(form.get('sort')) || 0, active: flag(form, 'active') };
  const db = getDb();
  if (id) await db.category.update({ where: { id }, data: values });
  else await db.category.createMany({ data: [{ ...values, slug: slugify(name) }], skipDuplicates: true });
  await logActivity(admin.id, 'category_saved', name);
  refresh();
}

export async function deleteCategory(form) {
  const admin = await requireAdmin();
  await getDb().category.delete({ where: { id: Number(form.get('id')) } });
  await logActivity(admin.id, 'category_deleted');
  refresh();
}

export async function saveCountry(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const name = text(form, 'name');
  if (!name) return;
  const categoryId = Number(form.get('category_id')) || null;
  const db = getDb();
  if (id) {
    await db.country.update({ where: { id }, data: { name, category_id: categoryId, active: flag(form, 'active') } });
    await rebuildSearchTextForCountry(id);
  } else {
    await db.country.createMany({ data: [{ name, slug: slugify(name), category_id: categoryId }], skipDuplicates: true });
  }
  await logActivity(admin.id, 'country_saved', name);
  refresh();
}

export async function saveCity(form) {
  const admin = await requireAdmin();
  const name = text(form, 'name');
  const countryId = Number(form.get('country_id'));
  if (!name || !countryId) return;
  await getDb().city.createMany({ data: [{ country_id: countryId, name, slug: slugify(name), featured: flag(form, 'featured') }], skipDuplicates: true });
  await logActivity(admin.id, 'city_added', name);
  refresh();
}

export async function updateCity(form) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const db = getDb();
  if (form.get('action') === 'delete') await db.city.delete({ where: { id } });
  else if (form.get('action') === 'feature') {
    const city = await db.city.findUnique({ where: { id } });
    await db.city.update({ where: { id }, data: { featured: !city.featured } });
  } else if (form.get('action') === 'active') {
    const city = await db.city.findUnique({ where: { id } });
    await db.city.update({ where: { id }, data: { active: !city.active } });
  }
  refresh();
}

// Castes / biradari. Profiles keep the caste text they were saved with; renaming can carry it over.
export async function saveCaste(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const db = getDb();
  const urdu = text(form, 'name_ur').slice(0, 60) || null;
  if (!id) {
    // Several may be added at once, separated by commas or new lines.
    const names = [...new Set(text(form, 'name').split(/[,\n،]/).map((name) => name.trim().slice(0, 60)).filter(Boolean))];
    if (names.length === 0) return;
    await db.caste.createMany({ data: names.map((name) => ({ name, name_ur: names.length === 1 ? urdu : null, popular: flag(form, 'popular') })), skipDuplicates: true });
    await logActivity(admin.id, 'caste_added', names.join(', ').slice(0, 200));
    return refresh();
  }
  const name = text(form, 'name').slice(0, 60);
  const old = await db.caste.findUnique({ where: { id } });
  if (!name || !old) return;
  if (name !== old.name && await db.caste.findFirst({ where: { name, NOT: { id } } })) return;
  await db.caste.update({ where: { id }, data: { name, name_ur: urdu, popular: flag(form, 'popular'), active: flag(form, 'active'), sort: Math.max(0, Math.min(999, Number(form.get('sort')) || 100)) } });
  if (name !== old.name && flag(form, 'rename_profiles')) {
    await db.profile.updateMany({ where: { caste: old.name }, data: { caste: name } });
    await db.profile.updateMany({ where: { pref_caste: old.name }, data: { pref_caste: name } });
    await rebuildSearchText({ caste: name });
  }
  await logActivity(admin.id, 'caste_saved', name);
  refresh();
}

export async function deleteCaste(form) {
  const admin = await requireAdmin();
  const caste = await getDb().caste.delete({ where: { id: Number(form.get('id')) } }).catch(() => null);
  if (caste) await logActivity(admin.id, 'caste_deleted', caste.name);
  refresh();
}

// Matching
export async function saveMatching(_previous, form) {
  const admin = await requireAdmin();
  const weights = Object.fromEntries(['age', 'religion', 'caste', 'education', 'city', 'country', 'preferences'].map((key) => [key, Math.max(0, Math.min(100, Number(form.get(`weight_${key}`)) || 0))]));
  if (Object.values(weights).every((value) => value === 0)) return { ok: false, message: 'At least one weight must be above zero.' };
  const minScore = Math.max(0, Math.min(100, Number(form.get('match_min_score')) || 0));
  const max = Math.max(1, Math.min(20, Number(form.get('match_max_per_email')) || 5));
  await saveSettings({ match_weights: JSON.stringify(weights), match_min_score: minScore, match_max_per_email: max, match_enabled: flag(form, 'match_enabled') ? '1' : '0' });
  await logActivity(admin.id, 'matching_rules_saved');
  refresh();
  return { ok: true, message: 'Matching rules saved.' };
}

export async function runMatchingNow() {
  const admin = await requireAdmin();
  const result = await sendMatchEmails({ force: true });
  await logActivity(admin.id, 'match_emails_run', null, JSON.stringify(result));
  refresh();
  return { ok: !result.skipped, message: result.skipped ?? `Checked ${result.checked} members. Sent ${result.emailed} emails with ${result.matches} matches. ${result.failed} failed.` };
}

// Email
export async function saveTemplate(_previous, form) {
  const admin = await requireAdmin();
  const key = text(form, 'key');
  const subject = text(form, 'subject');
  const body = text(form, 'body');
  if (!subject || !body) return { ok: false, message: 'Subject and message are required.' };
  await getDb().emailTemplate.update({ where: { key }, data: { subject, body, enabled: flag(form, 'enabled') } });
  await logActivity(admin.id, 'email_template_saved', key);
  refresh();
  return { ok: true, message: 'Template saved.' };
}

export async function saveSmtp(_previous, form) {
  const admin = await requireAdmin();
  const values = { smtp_host: text(form, 'host'), smtp_port: text(form, 'port'), smtp_secure: form.get('secure') ? 'true' : 'false', smtp_user: text(form, 'user'), smtp_from: text(form, 'from') };
  const password = String(form.get('password') ?? '');
  if (password) values.smtp_pass_enc = encryptText(password);
  if (form.get('clear_password')) values.smtp_pass_enc = '';
  await saveSettings(values);
  await logActivity(admin.id, 'smtp_settings_saved');
  refresh();
  return { ok: true, message: 'SMTP settings saved.' };
}

export async function sendSmtpTest(_previous, form) {
  await requireAdmin();
  const to = text(form, 'to');
  if (!z.email().safeParse(to).success) return { ok: false, message: 'Enter a valid email address.' };
  try {
    await testSmtp(to);
    return { ok: true, message: `Test email sent to ${to}.` };
  } catch (error) {
    return { ok: false, message: `SMTP test failed: ${error.message}` };
  }
}

// Chat
export async function saveChatSettings(_previous, form) {
  const admin = await requireAdmin();
  await saveSettings({ chat_enabled: flag(form, 'chat_enabled') ? '1' : '0', chat_require_approved: flag(form, 'chat_require_approved') ? '1' : '0' });
  await logActivity(admin.id, 'chat_settings_saved');
  refresh();
  return { ok: true, message: 'Chat settings saved.' };
}

// Content
export async function saveContent(_previous, form) {
  const admin = await requireAdmin();
  const { CONTENT_FIELDS } = await import('@/lib/content-fields.js');
  await saveSettings(Object.fromEntries(CONTENT_FIELDS.map(([key]) => [key, text(form, key)])));
  await logActivity(admin.id, 'content_saved');
  refresh();
  return { ok: true, message: 'Website content saved.' };
}

export async function saveFaq(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const values = { question: text(form, 'question'), answer: text(form, 'answer'), answer_ur: text(form, 'answer_ur') || null, sort: Number(form.get('sort')) || 0, active: flag(form, 'active') };
  if (!values.question || !values.answer) return;
  const db = getDb();
  if (id) await db.faq.update({ where: { id }, data: values });
  else await db.faq.create({ data: values });
  await logActivity(admin.id, 'faq_saved', values.question.slice(0, 60));
  refresh();
}

export async function deleteFaq(form) {
  await requireAdmin();
  await getDb().faq.delete({ where: { id: Number(form.get('id')) } });
  refresh();
}

export async function toggleEnquiry(form) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const db = getDb();
  const enquiry = await db.enquiry.findUnique({ where: { id } });
  await db.enquiry.update({ where: { id }, data: { handled: !enquiry.handled } });
  refresh();
}
