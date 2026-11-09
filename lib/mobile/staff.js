// Mobile API: administrators and consultants. The app shows the website's own admin and consultant
// panels inside the app, so every tool the website has is there, with the same checks.
import { getDb } from '../db.js';
import { sha256, signValue, verifySignature } from '../security.js';
import { fail, readJson, requireMember } from './core.js';

const LINK_SECONDS = 60;
const PANELS = { admin: '/admin', consultant: '/consultant' };

function requireStaff(ctx) {
  const user = requireMember(ctx);
  if (!PANELS[user.role]) fail('This is for the Al Zaujain team only.', 403);
  return user;
}

// A one-minute sign-in link for the in-app panel. It is tied to this phone's session, so signing
// out of the app (or being signed out by an administrator) makes any unused link worthless.
export async function webLink(ctx) {
  const user = requireStaff(ctx);
  const next = panelPath(user.role, (await readJson(ctx.request)).next);
  const payload = [user.id, Math.floor(Date.now() / 1000) + LINK_SECONDS, sha256(ctx.token).slice(0, 24)].join('.');
  return { url: `/app-login?${new URLSearchParams({ t: `${payload}.${signValue(`app-web:${payload}`)}`, next })}` };
}

// Used by /app-login: returns the staff member the link belongs to, or null.
export async function userFromWebLink(value = '') {
  const [id, expires, session, signature] = String(value).split('.');
  if (!signature || !verifySignature(`app-web:${id}.${expires}.${session}`, signature)) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: Number(id) }, select: { id: true, role: true, status: true } });
  if (!user || user.status !== 'active' || !PANELS[user.role]) return null;
  const live = await db.session.findFirst({ where: { user_id: user.id, token_hash: { startsWith: session }, expires_at: { gt: new Date() } }, select: { user_id: true } });
  return live ? user : null;
}

export const panelPath = (role, next) => {
  const panel = PANELS[role];
  if (!panel) return '/';
  return typeof next === 'string' && (next === panel || next.startsWith(`${panel}/`) || next.startsWith(`${panel}?`)) && !next.includes('//') ? next : panel;
};

// The figures on the app's admin home: what is waiting for the team.
export async function adminSummary(ctx) {
  const user = requireStaff(ctx);
  if (user.role !== 'admin') fail('This is for administrators only.', 403);
  const db = getDb();
  const [pendingProfiles, verification, payments, enquiries, profiles, members, credits] = await Promise.all([
    db.profile.count({ where: { status: 'pending' } }),
    db.profile.count({ where: { verification_status: 'pending' } }),
    db.paymentRequest.count({ where: { status: 'pending' } }),
    db.enquiry.count({ where: { handled: false } }),
    db.profile.count({ where: { status: 'approved' } }),
    db.user.count({ where: { role: 'user' } }),
    db.paymentRequest.count({ where: { status: 'pending', package_id: { not: null } } }),
  ]);
  return { pendingProfiles, verification, payments, enquiries, profiles, members, creditPurchases: credits };
}
