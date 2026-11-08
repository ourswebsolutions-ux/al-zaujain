'use server';

import { redirect } from 'next/navigation';
import { claimWithToken, checkLogin, homeFor, passwordRule, registerAccount, replacePassword, requestPasswordReset, saveAccountDetails, saveNotificationChoices } from '@/lib/accounts.js';
import { consumeToken, createSession, destroySession, requireUser } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { sendTemplate } from '@/lib/mail.js';
import { hashPassword, logActivity } from '@/lib/security.js';

const safeNext = (next) => (typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : null);

export async function register(_previous, formData) {
  const values = Object.fromEntries(['name', 'email', 'phone', 'password'].map((key) => [key, formData.get(key) ?? '']));
  const result = await registerAccount(values, String(formData.get('claim') ?? ''));
  if (!result.ok) return result;
  await createSession(result.userId);
  redirect('/dashboard?welcome=1');
}

export async function login(_previous, formData) {
  const result = await checkLogin(formData.get('email'), formData.get('password'), { portal: formData.get('portal') });
  if (!result.ok) return result;
  await createSession(result.userId);
  redirect(safeNext(formData.get('next')) ?? homeFor(result.role));
}

export async function logout() {
  await destroySession();
  redirect('/');
}

export async function forgotPassword(_previous, formData) {
  return requestPasswordReset(formData.get('email'));
}

export async function resetPassword(_previous, formData) {
  const parsed = passwordRule.safeParse(formData.get('password'));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (formData.get('password') !== formData.get('confirm')) return { ok: false, message: 'The two passwords do not match.' };
  const userId = await consumeToken(String(formData.get('token') ?? ''), 'reset_password');
  if (!userId) return { ok: false, message: 'This reset link has expired. Please request a new one.' };
  const db = getDb();
  const user = await db.user.update({ where: { id: userId }, data: { password_hash: hashPassword(parsed.data) }, select: { name: true, email: true } });
  await db.session.deleteMany({ where: { user_id: userId } });
  await sendTemplate('password_changed', user.email, { name: user.name });
  await logActivity(userId, 'password_reset');
  redirect('/login?notice=password-reset');
}

export async function updateAccount(_previous, formData) {
  const user = await requireUser();
  return saveAccountDetails(user.id, { name: formData.get('name'), phone: formData.get('phone') ?? '' });
}

export async function changePassword(_previous, formData) {
  const user = await requireUser();
  const result = await replacePassword(user, formData.get('current'), formData.get('password'));
  if (result.ok) await createSession(user.id);
  return result;
}

export async function updateNotifications(_previous, formData) {
  const user = await requireUser();
  return saveNotificationChoices(user.id, formData.get('match_frequency'), formData.get('show_in_views'));
}

// Attaches a login-free profile using its private manage link.
export async function claimProfile(formData) {
  const user = await requireUser();
  await claimWithToken(user.id, formData.get('token'));
  redirect('/dashboard');
}
