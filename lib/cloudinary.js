// Cloudinary storage for the website's public images (homepage banners and the director's photo).
// Credentials come only from the server environment: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and
// CLOUDINARY_API_SECRET. Private files (profile photos, CNIC copies, receipts) never go here: they
// stay on the server, behind the website's own access checks.
import crypto from 'node:crypto';

const env = () => ({
  cloud: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  key: process.env.CLOUDINARY_API_KEY?.trim(),
  secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

export const cloudinaryConfigured = () => {
  const { cloud, key, secret } = env();
  return !!(cloud && key && secret);
};

// Only images in this account's own delivery space are accepted as stored values.
export const isCloudinaryUrl = (value) => {
  const { cloud } = env();
  return typeof value === 'string' && !!cloud && value.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`) && value.length < 400;
};

function sign(params, secret) {
  const base = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(base + secret).digest('hex');
}

async function call(path, params, file) {
  const { cloud, key, secret } = env();
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { ...params, timestamp };
  const form = new FormData();
  for (const [name, value] of Object.entries(signed)) form.append(name, String(value));
  form.append('api_key', key);
  form.append('signature', sign(signed, secret));
  if (file) form.append('file', new Blob([file], { type: 'image/webp' }), 'image.webp');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/${path}`, { method: 'POST', body: form, signal: AbortSignal.timeout(60000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(`Cloudinary: ${body.error?.message ?? response.status}`);
  return body;
}

// Uploads an already cleaned image (EXIF removed, resized) and returns its https address.
export async function uploadToCloudinary(buffer, folder = 'alzaujain/homepage') {
  const result = await call('upload', { folder }, buffer);
  return result.secure_url;
}

// ".../image/upload/v1712345/alzaujain/homepage/abc.webp" → "alzaujain/homepage/abc"
export const publicIdFromUrl = (url) => (url.split('/image/upload/')[1] ?? '').replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '');

export async function deleteFromCloudinary(url) {
  if (!isCloudinaryUrl(url) || !cloudinaryConfigured()) return;
  await call('destroy', { public_id: publicIdFromUrl(url), invalidate: 'true' }).catch(() => {});
}

// Delivers the image in the best format and quality for each browser, at a sensible width.
export const cloudinaryVariant = (url, width) => url.replace('/image/upload/', `/image/upload/f_auto,q_auto${width ? `,c_limit,w_${width}` : ''}/`);
