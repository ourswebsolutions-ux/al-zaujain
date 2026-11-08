// Account rules shared by the website's server actions and the mobile app.
// Each function returns { ok, message, ... } and leaves cookies and redirects to the caller.
import { z } from 'zod';
import { clientIp, issueToken } from './auth.js';
import { getDb } from './db.js';
import { sendTemplate, siteUrl } from './mail.js';
import { notify } from './notifications.js';
import { hashPassword, logActivity, rateLimit, sha256, verifyPassword } from './security.js';

export const passwordRule = z.string().min(8, 'Password must be at least 8 characters').max(128);
const phoneRule = z.string().trim().regex(/^[+0-9\s()-]{7,20}$/, 'Enter a valid phone number');

let dummyHash;
const timingHash = () => { dummyHash ??= hashPassword('timing-equaliser'); return dummyHash; };

export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'consultant' ? '/consultant' : '/dashboard');

export async function registerAccount(values, claim) {
  const schema = z.object({
    name: z.string().trim().min(2, 'Please enter your name').max(100),
    email: z.email('Enter a valid email address').max(160),
    phone: phoneRule,
    password: passwordRule,
  });
  const parsed = schema.safeParse(Object.fromEntries(['name', 'email', 'phone', 'password'].map((key) => [key, values[key] ?? ''])));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!(await rateLimit(`register:${await clientIp()}`, 10, 3600))) return { ok: false, message: 'Too many attempts. Please try again later.' };

  const { name, email, phone, password } = parsed.data;
  const db = getDb();
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: 'An account with this email already exists. Please sign in.' };
  const { id: userId } = await db.user.create({ data: { email, password_hash: hashPassword(password), name, phone } });
  await logActivity(userId, 'user_registered');
  await notify(userId, { type: 'account', title: 'Welcome to Al Zaujain', body: 'Your account is ready. Create your matrimonial biodata to start receiving proposals.', href: '/dashboard/edit' });

  // A private manage link proves ownership of a profile submitted before registering.
  if (claim) await claimWithToken(userId, claim);
  return { ok: true, userId };
}

export async function checkLogin(rawEmail, password, { portal } = {}) {
  const email = String(rawEmail ?? '').trim().toLowerCase();
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}:${email}`, 8, 900)) || !(await rateLimit(`login-ip:${ip}`, 40, 900))) {
    return { ok: false, message: 'Too many attempts. Please wait 15 minutes and try again.' };
  }
  const user = await getDb().user.findUnique({ where: { email }, select: { id: true, password_hash: true, role: true, status: true } });
  const valid = verifyPassword(String(password ?? ''), user?.password_hash ?? timingHash());
  if (!user || !valid) return { ok: false, message: 'Incorrect email or password.' };
  if (user.status !== 'active') return { ok: false, message: 'This account has been suspended. Please contact our team.' };
  if (portal === 'consultant' && user.role !== 'consultant') return { ok: false, message: 'This login is for marriage consultants only.' };
  await logActivity(user.id, 'login');
  return { ok: true, userId: user.id, role: user.role };
}

export async function requestPasswordReset(rawEmail) {
  const email = String(rawEmail ?? '').trim();
  if (!(await rateLimit(`forgot:${await clientIp()}`, 6, 3600))) return { ok: false, message: 'Too many requests. Please try again later.' };
  const user = await getDb().user.findFirst({ where: { email, status: 'active' }, select: { id: true, name: true, email: true } });
  if (user) {
    const token = await issueToken(user.id, 'reset_password', 1);
    await sendTemplate('password_reset', user.email, { name: user.name, reset_url: `${siteUrl()}/reset-password/${token}` });
  }
  return { ok: true, message: 'If that email is registered, a reset link is on its way.' };
}

export async function saveAccountDetails(userId, values) {
  const schema = z.object({ name: z.string().trim().min(2).max(100), phone: phoneRule.or(z.literal('')) });
  const parsed = schema.safeParse({ name: values.name, phone: values.phone ?? '' });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await getDb().user.update({ where: { id: userId }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  return { ok: true, message: 'Your details have been saved.' };
}

// Checks and stores a new password, and signs every device out. The caller signs this one back in.
export async function replacePassword(user, current, next) {
  const parsed = passwordRule.safeParse(next);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const db = getDb();
  const row = await db.user.findUnique({ where: { id: user.id }, select: { password_hash: true } });
  if (!verifyPassword(String(current ?? ''), row.password_hash)) return { ok: false, message: 'Your current password is incorrect.' };
  await db.user.update({ where: { id: user.id }, data: { password_hash: hashPassword(parsed.data) } });
  await db.session.deleteMany({ where: { user_id: user.id } });
  await sendTemplate('password_changed', user.email, { name: user.name });
  await logActivity(user.id, 'password_changed');
  return { ok: true, message: 'Your password has been changed.' };
}

export async function saveNotificationChoices(userId, frequency, showInViews) {
  if (!['daily', 'weekly', 'off'].includes(frequency)) return { ok: false, message: 'Choose a valid frequency.' };
  await getDb().user.update({ where: { id: userId }, data: { match_emails: frequency !== 'off', match_frequency: frequency, show_in_views: !!showInViews } });
  return { ok: true, message: 'Your preferences have been saved.' };
}

// Attaches a login-free profile to an account using its private manage link.
export const claimWithToken = (userId, token) => getDb().profile.updateMany({ where: { manage_token_hash: sha256(String(token ?? '')), user_id: null }, data: { user_id: userId } });
