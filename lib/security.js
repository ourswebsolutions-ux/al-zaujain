import crypto from 'node:crypto';
import { getDb } from './db.js';

export function appSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('APP_SECRET is missing or too short. Run "npm run setup" to create .env.local.');
  }
  return secret;
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, key] = (stored ?? '').split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(actual, expected);
}

const derivedKey = (purpose) => Buffer.from(crypto.hkdfSync('sha256', appSecret(), '', `al-zaujain:${purpose}`, 32));

// AES-256-GCM. Output layout: 12-byte IV, 16-byte tag, ciphertext.
export function encrypt(buffer, purpose) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey(purpose), iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decrypt(payload, purpose) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey(purpose), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]);
}

export const encryptText = (text) => encrypt(Buffer.from(text, 'utf8'), 'settings').toString('base64');
export const decryptText = (text) => decrypt(Buffer.from(text, 'base64'), 'settings').toString('utf8');

export const signValue = (value) => crypto.createHmac('sha256', derivedKey('signing')).update(String(value)).digest('base64url');
export function verifySignature(value, signature = '') {
  const expected = Buffer.from(signValue(value));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Fixed-window limiter. The row stays locked between the write and the read, so each
// request sees its own count and concurrent requests cannot slip past the limit.
export async function rateLimit(key, max, windowSeconds) {
  const id = sha256(key);
  const now = Date.now();
  const reset = now + windowSeconds * 1000;
  const row = await getDb().$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO rate_limits (rl_key, hits, reset_at) VALUES (${id}, 1, ${reset})
      ON DUPLICATE KEY UPDATE hits = IF(reset_at <= ${now}, 1, hits + 1), reset_at = IF(reset_at <= ${now}, ${reset}, reset_at)`;
    return tx.rateLimit.findUnique({ where: { key: id } });
  });
  return row.hits <= max;
}

export function logActivity(actorId, action, target = null, detail = null) {
  return getDb().activityLog.create({ data: { actor_id: actorId ?? null, action, target, detail: detail?.slice(0, 500) ?? null } });
}
