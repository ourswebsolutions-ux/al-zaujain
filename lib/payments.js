import { getDb } from './db.js';
import { logActivity, rateLimit } from './security.js';
import { notify } from './notifications.js';
import { getSetting } from './settings.js';
import { deleteReceipt, saveReceipt, UploadError } from './uploads.js';

const DAY = 86400000;

export const activePaymentMethods = () => getDb().paymentMethod.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] });

export async function defaultAccessDays() {
  const days = Number(await getSetting('access_days'));
  return Number.isFinite(days) && days >= 0 ? days : 365;
}

export function accessState(access) {
  if (!access || !access.active) return access ? 'revoked' : 'none';
  if (access.expires_at && access.expires_at <= new Date()) return 'expired';
  return 'active';
}

export async function memberPaymentState(userId) {
  const db = getDb();
  const [access, requests] = await Promise.all([
    db.memberAccess.findUnique({ where: { user_id: userId } }),
    db.paymentRequest.findMany({ where: { user_id: userId }, orderBy: { id: 'desc' }, take: 100 }),
  ]);
  const state = accessState(access);
  return { access, state, requests, pending: requests.find((request) => request.status === 'pending') ?? null };
}

// Validates everything, then stores the request as pending. Nothing here can unlock content.
export async function submitPayment(form, user) {
  const db = getDb();
  if (!(await rateLimit(`payment:${user.id}`, 10, 3600))) return { ok: false, status: 429, message: 'Too many attempts. Please try again later.' };

  const { state, pending } = await memberPaymentState(user.id);
  if (state === 'active') return { ok: false, status: 409, message: 'You already have active access.' };
  if (pending) return { ok: false, status: 409, message: 'You already have a payment waiting for review.' };

  const method = await db.paymentMethod.findFirst({ where: { id: Number(form.get('method_id')) || 0, active: true } });
  if (!method) return { ok: false, status: 422, message: 'Please choose a payment method.' };

  const sender = String(form.get('sender_name') ?? '').trim();
  const transaction = String(form.get('transaction_id') ?? '').trim();
  const amount = Number(String(form.get('amount') ?? '').replace(/,/g, ''));
  const receipt = form.get('receipt');
  if (sender.length < 2 || sender.length > 120) return { ok: false, status: 422, message: 'Please enter the sender name.' };
  if (transaction.length < 3 || transaction.length > 80) return { ok: false, status: 422, message: 'Please enter the transaction ID.' };
  if (!(amount > 0) || amount > 9999999999) return { ok: false, status: 422, message: 'Please enter the amount paid.' };
  if (!receipt?.size) return { ok: false, status: 422, message: 'Please upload your payment receipt.' };

  const used = await db.paymentRequest.findFirst({ where: { transaction_id: transaction, method_id: method.id, status: { not: 'rejected' } } });
  if (used) return { ok: false, status: 409, message: 'This transaction ID has already been submitted.' };

  const fileName = await saveReceipt(receipt);
  try {
    const request = await db.paymentRequest.create({ data: { user_id: user.id, method_id: method.id, method_name: method.name, sender_name: sender, transaction_id: transaction, amount: amount.toFixed(2), receipt_file: fileName } });
    await logActivity(user.id, 'payment_submitted', `payment:${request.id}`);
    await notify(user.id, { type: 'payment', title: 'Payment received', body: 'Our team will review it shortly.', href: '/dashboard/payments' });
    return { ok: true, id: request.id };
  } catch (error) {
    deleteReceipt(fileName);
    throw error;
  }
}

// Extends from the current end date when access is still running, otherwise from today.
export async function grantAccess(userId, days, adminId, note = null) {
  const db = getDb();
  const current = await db.memberAccess.findUnique({ where: { user_id: userId } });
  const running = accessState(current) === 'active';
  let expires = null;
  if (days > 0) {
    if (running && !current.expires_at) expires = null;
    else expires = new Date((running ? current.expires_at.getTime() : Date.now()) + days * DAY);
  }
  await db.memberAccess.upsert({
    where: { user_id: userId },
    create: { user_id: userId, active: true, expires_at: expires, granted_by: adminId, note },
    update: { active: true, expires_at: expires, granted_by: adminId, note },
  });
  return expires;
}

export async function revokeAccess(userId, adminId) {
  await getDb().memberAccess.updateMany({ where: { user_id: userId }, data: { active: false, granted_by: adminId } });
  await notify(userId, { type: 'payment', title: 'Your full profile access has ended', body: 'Please contact our team if you have any questions.', href: '/dashboard/payments' });
}

export async function setAccessExpiry(userId, date, adminId) {
  await getDb().memberAccess.upsert({
    where: { user_id: userId },
    create: { user_id: userId, active: true, expires_at: date, granted_by: adminId },
    update: { active: true, expires_at: date, granted_by: adminId },
  });
}

// The conditional update means two administrators cannot both act on the same request.
export async function approvePayment(id, adminId, days, note) {
  const db = getDb();
  const { count } = await db.paymentRequest.updateMany({ where: { id, status: 'pending' }, data: { status: 'approved', reviewed_by: adminId, reviewed_at: new Date(), admin_note: note } });
  if (count === 0) return false;
  const request = await db.paymentRequest.findUnique({ where: { id } });
  await grantAccess(request.user_id, days, adminId, `Payment #${id}`);
  await notify(request.user_id, { type: 'payment', title: 'Your payment is approved', body: 'Full profile access is now unlocked.', href: '/dashboard/payments' });
  await logActivity(adminId, 'payment_approved', `payment:${id}`);
  return true;
}

export async function rejectPayment(id, adminId, note) {
  const db = getDb();
  const { count } = await db.paymentRequest.updateMany({ where: { id, status: 'pending' }, data: { status: 'rejected', reviewed_by: adminId, reviewed_at: new Date(), admin_note: note } });
  if (count === 0) return false;
  const request = await db.paymentRequest.findUnique({ where: { id } });
  await notify(request.user_id, { type: 'payment', title: 'Your payment could not be approved', body: 'Please check the details or contact our team.', href: '/dashboard/payments' });
  await logActivity(adminId, 'payment_rejected', `payment:${id}`);
  return true;
}

export { UploadError };
