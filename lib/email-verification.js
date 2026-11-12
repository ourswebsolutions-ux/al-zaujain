// Email confirmation with a 6-digit code, for the website and the mobile app alike.
//
// Only an HMAC of the code is stored (never the code), each code expires after 15 minutes, allows five
// tries, and a new code can be asked for once a minute and at most six times an hour.
import crypto from 'node:crypto';
import { getDb } from './db.js';
import { sendTemplate } from './mail.js';
import { logActivity, rateLimit, signValue } from './security.js';

const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

const TEMPLATE = {
  key: 'email_code',
  name: 'Email confirmation code',
  subject: 'Your Al Zaujain confirmation code: {{code}}',
  body: 'Assalam o Alaikum {{name}},\n\nYour Al Zaujain email confirmation code is:\n\n{{code}}\n\nEnter it on the website or in the app to confirm your email. The code expires in {{minutes}} minutes.\n\nIf you did not create an Al Zaujain account, you can ignore this email.',
};

const hashCode = (userId, code) => signValue(`email-code:${userId}:${code}`);

export async function isEmailVerified(userId) {
  const user = await getDb().user.findUnique({ where: { id: userId }, select: { email_verified_at: true } });
  return !!user?.email_verified_at;
}

// The template is created the first time it is needed, so administrators can then edit its wording.
async function ensureTemplate() {
  const db = getDb();
  if (await db.emailTemplate.findUnique({ where: { key: TEMPLATE.key }, select: { key: true } })) return;
  try {
    await db.emailTemplate.create({ data: { key: TEMPLATE.key, name: TEMPLATE.name, subject: TEMPLATE.subject, body: TEMPLATE.body, variables: 'name, code, minutes', enabled: true } });
  } catch {
    // Created at the same moment by another request.
  }
}

/** Sends a new code. Returns { ok, message, wait? }. */
export async function sendVerificationCode(userId) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, email_verified_at: true } });
  if (!user) return { ok: false, message: 'Account not found.' };
  if (user.email_verified_at) return { ok: true, message: 'Your email is already confirmed.', verified: true };

  const last = await db.emailCode.findFirst({ where: { user_id: userId }, orderBy: { id: 'desc' }, select: { created_at: true } });
  const since = last ? (Date.now() - last.created_at.getTime()) / 1000 : Infinity;
  if (since < RESEND_SECONDS) {
    const wait = Math.ceil(RESEND_SECONDS - since);
    return { ok: false, message: `Please wait ${wait} seconds before asking for a new code.`, wait };
  }
  if (!(await rateLimit(`email-code:${userId}`, 6, 3600))) return { ok: false, message: 'Too many codes asked for. Please try again in an hour.' };

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await db.$transaction([
    db.emailCode.deleteMany({ where: { user_id: userId } }),
    db.emailCode.create({ data: { user_id: userId, code_hash: hashCode(userId, code), expires_at: new Date(Date.now() + CODE_MINUTES * 60000) } }),
  ]);
  await ensureTemplate();
  const status = await sendTemplate(TEMPLATE.key, user.email, { name: user.name, code, minutes: CODE_MINUTES });
  if (status !== 'sent') {
    // Nothing was delivered, so the member may ask again at once.
    await db.emailCode.deleteMany({ where: { user_id: userId } });
    return { ok: false, message: 'We could not send the email right now. Please check your email address and try again in a moment.' };
  }
  return { ok: true, message: `We sent a 6-digit code to ${user.email}.`, wait: RESEND_SECONDS };
}

/** Checks a code. Returns { ok, message }. */
export async function verifyEmailCode(userId, rawCode) {
  const code = String(rawCode ?? '').replace(/\D/g, '');
  if (code.length !== 6) return { ok: false, message: 'Enter the 6-digit code from the email.' };
  const db = getDb();
  if (await isEmailVerified(userId)) return { ok: true, message: 'Your email is already confirmed.' };
  const row = await db.emailCode.findFirst({ where: { user_id: userId }, orderBy: { id: 'desc' } });
  if (!row) return { ok: false, message: 'Please ask for a new code.' };
  if (row.expires_at < new Date()) return { ok: false, message: 'This code has expired. Please ask for a new one.' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, message: 'Too many wrong codes. Please ask for a new one.' };
  const expected = Buffer.from(row.code_hash);
  const actual = Buffer.from(hashCode(userId, code));
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    await db.emailCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false, message: left > 0 ? `That code is not correct. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Please ask for a new one.' };
  }
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { email_verified_at: new Date() } }),
    db.emailCode.deleteMany({ where: { user_id: userId } }),
  ]);
  await logActivity(userId, 'email_verified');
  return { ok: true, message: 'Your email is confirmed. Thank you!' };
}
