'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { accessState, approvePayment, defaultAccessDays, grantAccess, rejectPayment, revokeAccess, setAccessExpiry } from '@/lib/payments.js';
import { notify } from '@/lib/notifications.js';
import { RESTRICTIONS } from '@/lib/restrictions.js';
import { logActivity } from '@/lib/security.js';
import { saveSettings } from '@/lib/settings.js';
import { deletePaymentImage, savePaymentImage, UploadError } from '@/lib/uploads.js';

const refresh = () => revalidatePath('/', 'layout');
const text = (form, key) => String(form.get(key) ?? '').trim();

export async function saveMethod(_previous, form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const values = { name: text(form, 'name'), account_holder: text(form, 'account_holder'), bank_name: text(form, 'bank_name'), iban: text(form, 'iban') || null, account_number: text(form, 'account_number') || null, instructions: text(form, 'instructions') || null, active: !!form.get('active') };
  if (!values.name || !values.account_holder || !values.bank_name) return { ok: false, message: 'Please fill in the name, account holder and bank.' };
  if (!values.iban && !values.account_number) return { ok: false, message: 'Please enter an IBAN or an account number.' };
  if (values.name.length > 100 || values.account_holder.length > 120 || values.bank_name.length > 120 || (values.iban ?? '').length > 40 || (values.account_number ?? '').length > 40) return { ok: false, message: 'One of these details is too long.' };
  const db = getDb();
  const existing = id ? await db.paymentMethod.findUnique({ where: { id } }) : null;
  if (id && !existing) return { ok: false, message: 'Payment method not found.' };
  const file = form.get('qr_image');
  try {
    if (file?.size > 0) values.qr_image = await savePaymentImage(file);
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message };
    throw error;
  }
  if (values.qr_image || form.get('remove_qr')) {
    deletePaymentImage(existing?.qr_image);
    if (!values.qr_image) values.qr_image = null;
  }
  if (existing) await db.paymentMethod.update({ where: { id }, data: values });
  else await db.paymentMethod.create({ data: values });
  await logActivity(admin.id, 'payment_method_saved', values.name);
  refresh();
  redirect('/admin/payment-methods');
}

export async function toggleMethod(form) {
  await requireAdmin();
  const db = getDb();
  const id = Number(form.get('id'));
  const method = await db.paymentMethod.findUnique({ where: { id } });
  if (method) await db.paymentMethod.update({ where: { id }, data: { active: !method.active } });
  refresh();
}

export async function deleteMethod(form) {
  const admin = await requireAdmin();
  const db = getDb();
  const id = Number(form.get('id'));
  const method = await db.paymentMethod.findUnique({ where: { id } });
  if (!method) return;
  await db.paymentMethod.delete({ where: { id } });
  deletePaymentImage(method.qr_image);
  await logActivity(admin.id, 'payment_method_deleted', method.name);
  refresh();
}

export async function saveRestrictions(_previous, form) {
  const admin = await requireAdmin();
  const days = Math.max(0, Math.min(3650, Math.round(Number(form.get('access_days')) || 0)));
  await saveSettings({ ...Object.fromEntries(RESTRICTIONS.map((item) => [item.setting, form.get(item.key) ? '1' : '0'])), access_price: text(form, 'access_price').slice(0, 80), access_days: days });
  await logActivity(admin.id, 'restrictions_saved');
  refresh();
  return { ok: true, message: 'Restrictions saved. They now apply across the website.' };
}

export async function reviewPayment(form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id'));
  const note = text(form, 'admin_note').slice(0, 500) || null;
  if (form.get('decision') === 'approve') {
    const raw = text(form, 'days');
    const days = raw === '' ? await defaultAccessDays() : Math.max(0, Math.round(Number(raw) || 0));
    await approvePayment(id, admin.id, days, note);
  } else if (form.get('decision') === 'reject') {
    await rejectPayment(id, admin.id, note);
  } else {
    await getDb().paymentRequest.update({ where: { id }, data: { admin_note: note } });
  }
  refresh();
}

export async function adminGrantAccess(form) {
  const admin = await requireAdmin();
  const userId = Number(form.get('user_id'));
  const raw = text(form, 'days');
  const days = raw === '' ? await defaultAccessDays() : Math.max(0, Math.round(Number(raw) || 0));
  await grantAccess(userId, days, admin.id, 'Granted by administrator');
  await notify(userId, { type: 'payment', title: 'Full profile access is now unlocked', body: 'You can now see complete profiles.', href: '/dashboard/payments' });
  await logActivity(admin.id, 'access_granted', `user:${userId}`, `${days} days`);
  refresh();
}

export async function adminRevokeAccess(form) {
  const admin = await requireAdmin();
  const userId = Number(form.get('user_id'));
  await revokeAccess(userId, admin.id);
  await logActivity(admin.id, 'access_revoked', `user:${userId}`);
  refresh();
}

export async function adminSetExpiry(form) {
  const admin = await requireAdmin();
  const userId = Number(form.get('user_id'));
  const value = text(form, 'expires_at');
  const date = value ? new Date(`${value}T23:59:59Z`) : null;
  if (value && Number.isNaN(date.getTime())) return;
  // A blank date removes the end date from running access. It must never grant access by accident.
  if (!date && accessState(await getDb().memberAccess.findUnique({ where: { user_id: userId } })) !== 'active') return;
  await setAccessExpiry(userId, date, admin.id);
  await logActivity(admin.id, 'access_expiry_set', `user:${userId}`, value || 'no expiry');
  refresh();
}
