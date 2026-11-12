// Mobile API: signing in and out, registering, and the account settings page.
import { checkLogin, registerAccount, replacePassword, requestPasswordReset, saveAccountDetails, saveNotificationChoices } from '../accounts.js';
import { createApiSession, destroyApiSession, sessionUser } from '../auth.js';
import { unreadCount } from '../chat.js';
import { unlockedCodes } from '../credits.js';
import { getDb } from '../db.js';
import { sendVerificationCode, verifyEmailCode } from '../email-verification.js';
import { unreadNotifications } from '../notifications.js';
import { hasPaidAccess } from '../restrictions.js';
import { fail, readJson, requireMember } from './core.js';

async function accountState(user) {
  const [unreadMessages, unreadAlerts, paid, photo, unlocked, balance] = await Promise.all([
    unreadCount(user.id),
    unreadNotifications(user.id),
    hasPaidAccess(user.id),
    getDb().profilePhoto.findFirst({ where: { profile: { user_id: user.id } }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], select: { thumb: true } }),
    unlockedCodes(user.id),
    getDb().user.findUnique({ where: { id: user.id }, select: { credits: true, email_verified_at: true } }),
  ]);
  return {
    user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role,
      chatDisabled: user.chat_disabled, showInViews: user.show_in_views,
      // Members confirm their email with a 6-digit code before using the account (staff need not).
      emailVerified: user.role !== 'user' || !!balance?.email_verified_at,
      matchFrequency: user.match_emails ? user.match_frequency : 'off',
      avatar: photo ? `/media/photos/${photo.thumb}` : null,
      memberSince: user.created_at,
    },
    unreadMessages, unreadNotifications: unreadAlerts, paid,
    // The same balance and unlocked profiles the website shows.
    credits: balance?.credits ?? 0,
    unlocked: [...unlocked],
  };
}

const signedIn = async (userId) => {
  const token = await createApiSession(userId);
  return { token, ...(await accountState(await sessionUser(token))) };
};

export async function login({ request }) {
  const body = await readJson(request);
  const result = await checkLogin(body.email, body.password);
  if (!result.ok) fail(result.message, 422);
  return signedIn(result.userId);
}

export async function register({ request }) {
  const body = await readJson(request);
  const result = await registerAccount(body, typeof body.claim === 'string' ? body.claim : '');
  if (!result.ok) fail(result.message, 422);
  await sendVerificationCode(result.userId);
  return signedIn(result.userId);
}

export async function verifyEmail(ctx) {
  const user = requireMember(ctx);
  const result = await verifyEmailCode(user.id, (await readJson(ctx.request)).code);
  if (!result.ok) fail(result.message, 422);
  return { message: result.message, ...(await accountState(user)) };
}

export async function resendCode(ctx) {
  const user = requireMember(ctx);
  const result = await sendVerificationCode(user.id);
  if (!result.ok) fail(result.message, result.wait ? 429 : 503);
  return { message: result.message, wait: result.wait ?? 60 };
}

export async function logout({ token }) {
  await destroyApiSession(token);
  return {};
}

export async function forgot({ request }) {
  const result = await requestPasswordReset((await readJson(request)).email);
  if (!result.ok) fail(result.message, 429);
  return { message: result.message };
}

export async function me(ctx) {
  return accountState(requireMember(ctx));
}

export async function saveDetails(ctx) {
  const user = requireMember(ctx);
  const body = await readJson(ctx.request);
  const result = await saveAccountDetails(user.id, { name: body.name, phone: body.phone ?? '' });
  if (!result.ok) fail(result.message, 422);
  return { message: result.message, ...(await accountState(await sessionUser(ctx.token))) };
}

// Every device is signed out, then this phone gets a fresh session.
export async function changePassword(ctx) {
  const user = requireMember(ctx);
  const body = await readJson(ctx.request);
  const result = await replacePassword(user, body.current, body.password);
  if (!result.ok) fail(result.message, 422);
  return { message: result.message, token: await createApiSession(user.id) };
}

export async function saveNotifications(ctx) {
  const user = requireMember(ctx);
  const body = await readJson(ctx.request);
  const result = await saveNotificationChoices(user.id, body.match_frequency, body.show_in_views === true || body.show_in_views === '1');
  if (!result.ok) fail(result.message, 422);
  return { message: result.message, ...(await accountState(await sessionUser(ctx.token))) };
}
