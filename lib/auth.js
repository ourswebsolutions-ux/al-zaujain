import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db.js';
import { randomToken, sha256 } from './security.js';

const COOKIE = 'az_session';
const SESSION_DAYS = 30;

export async function clientIp() {
  const list = await headers();
  return list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'local';
}

export async function createSession(userId) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const db = getDb();
  await db.session.deleteMany({ where: { expires_at: { lt: new Date() } } });
  await db.session.create({ data: { token_hash: sha256(token), user_id: userId, expires_at: expires } });
  await db.user.update({ where: { id: userId }, data: { last_login_at: new Date() } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.SITE_URL ?? '').startsWith('https'),
    path: '/',
    expires,
  });
}

// The mobile app keeps the same kind of session, but holds the token itself and sends it as
// "Authorization: Bearer …". Browsers never send that header on their own, so it cannot be forged
// by another website the way a cookie can.
export async function createApiSession(userId) {
  const token = randomToken();
  const db = getDb();
  await db.session.deleteMany({ where: { expires_at: { lt: new Date() } } });
  await db.session.create({ data: { token_hash: sha256(token), user_id: userId, expires_at: new Date(Date.now() + SESSION_DAYS * 86400000) } });
  await db.user.update({ where: { id: userId }, data: { last_login_at: new Date() } });
  return token;
}

export const destroyApiSession = (token) => (token ? getDb().session.deleteMany({ where: { token_hash: sha256(token) } }) : null);

export const bearerToken = (value) => /^Bearer\s+([\w-]{20,200})$/i.exec(value ?? '')?.[1] ?? null;

export async function sessionUser(token) {
  if (!token) return null;
  const session = await getDb().session.findUnique({ where: { token_hash: sha256(token) }, select: { expires_at: true, user: { select: SESSION_USER } } });
  if (!session || session.expires_at <= new Date() || session.user.status !== 'active') return null;
  return session.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await getDb().session.deleteMany({ where: { token_hash: sha256(token) } });
  jar.delete(COOKIE);
}

const SESSION_USER = { id: true, email: true, name: true, phone: true, role: true, status: true, chat_disabled: true, show_in_views: true, match_emails: true, match_frequency: true, created_at: true };

// A mobile app token, when one is sent, takes the place of the browser cookie. Photos and receipts
// then open for the app exactly as they do on the website.
export const currentUser = cache(async () => {
  const token = bearerToken((await headers()).get('authorization')) ?? (await cookies()).get(COOKIE)?.value;
  return sessionUser(token);
});

export async function requireUser(next = '/dashboard') {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'admin') redirect('/');
  return user;
}

export async function requireConsultant() {
  const user = await currentUser();
  if (!user) redirect('/consultant/login');
  if (user.role !== 'consultant') redirect('/');
  const consultant = await getDb().consultant.findUnique({ where: { user_id: user.id } });
  if (!consultant) redirect('/');
  return { user, consultant };
}

// Single-use tokens for password reset.
export async function issueToken(userId, purpose, hours) {
  const token = randomToken();
  const db = getDb();
  await db.token.deleteMany({ where: { user_id: userId, purpose } });
  await db.token.create({ data: { token_hash: sha256(token), user_id: userId, purpose, expires_at: new Date(Date.now() + hours * 3600000) } });
  return token;
}

export async function peekToken(token, purpose) {
  const row = await getDb().token.findFirst({ where: { token_hash: sha256(token), purpose, used_at: null, expires_at: { gt: new Date() } } });
  return row?.user_id ?? null;
}

// The conditional update makes this safe if the same link is opened twice at once.
export async function consumeToken(token, purpose) {
  const { count } = await getDb().token.updateMany({ where: { token_hash: sha256(token), purpose, used_at: null, expires_at: { gt: new Date() } }, data: { used_at: new Date() } });
  if (count === 0) return null;
  return (await getDb().token.findUnique({ where: { token_hash: sha256(token) } })).user_id;
}
