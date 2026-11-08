import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { decrypt, encrypt } from './security.js';

const root = () => process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
export const photosDir = () => path.join(root(), 'uploads', 'photos');
export const consultantsDir = () => path.join(root(), 'uploads', 'consultants');
const cnicDir = () => path.join(root(), 'private', 'cnic');
const receiptDir = () => path.join(root(), 'private', 'receipts');
export const paymentImageDir = () => path.join(root(), 'uploads', 'payments');

export const MAX_PHOTOS = 6;
const MAX_BYTES = 8 * 1024 * 1024;

const newName = (extension) => `${crypto.randomUUID()}.${extension}`;

async function readImage(file, label) {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) throw new UploadError(`${label} is empty`);
  if (file.size > MAX_BYTES) throw new UploadError(`${label} is larger than 8 MB`);
  const buffer = Buffer.from(await file.arrayBuffer());
  // The bytes decide the type, never the file name or the browser's claimed type.
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new UploadError(`${label} is not a valid image`);
  }
  if (!['jpeg', 'png', 'webp'].includes(meta.format)) throw new UploadError(`${label} must be a JPG, PNG or WebP image`);
  return buffer;
}

export class UploadError extends Error {}

// Re-encoding removes EXIF data, including any GPS location embedded by a phone.
export async function savePhoto(file, label = 'Photo') {
  const buffer = await readImage(file, label);
  fs.mkdirSync(photosDir(), { recursive: true });
  const fileName = newName('webp');
  const thumb = newName('webp');
  await sharp(buffer).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(photosDir(), fileName));
  await sharp(buffer).rotate().resize({ width: 640, height: 640, fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toFile(path.join(photosDir(), thumb));
  return { file: fileName, thumb };
}

export async function saveConsultantPhoto(file) {
  const buffer = await readImage(file, 'Photo');
  fs.mkdirSync(consultantsDir(), { recursive: true });
  const fileName = newName('webp');
  await sharp(buffer).rotate().resize({ width: 640, height: 640, fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(path.join(consultantsDir(), fileName));
  return fileName;
}

export async function saveCnic(file, label) {
  const buffer = await readImage(file, label);
  const clean = await sharp(buffer).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  fs.mkdirSync(cnicDir(), { recursive: true, mode: 0o700 });
  const fileName = newName('enc');
  fs.writeFileSync(path.join(cnicDir(), fileName), encrypt(clean, 'cnic'), { mode: 0o600 });
  return fileName;
}

// Receipts hold bank details, so they are encrypted exactly like CNIC documents.
export async function saveReceipt(file) {
  const buffer = await readImage(file, 'Receipt');
  const clean = await sharp(buffer).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  fs.mkdirSync(receiptDir(), { recursive: true, mode: 0o700 });
  const fileName = newName('enc');
  fs.writeFileSync(path.join(receiptDir(), fileName), encrypt(clean, 'receipt'), { mode: 0o600 });
  return fileName;
}

export const readReceipt = (fileName) => decrypt(fs.readFileSync(path.join(receiptDir(), path.basename(fileName))), 'receipt');
export const deleteReceipt = (fileName) => remove(receiptDir(), fileName);

export async function savePaymentImage(file) {
  const buffer = await readImage(file, 'Image');
  fs.mkdirSync(paymentImageDir(), { recursive: true });
  const fileName = newName('webp');
  await sharp(buffer).rotate().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toFile(path.join(paymentImageDir(), fileName));
  return fileName;
}

export const deletePaymentImage = (fileName) => remove(paymentImageDir(), fileName);

// Rebuilt from 24 pixels, so the face cannot be recovered from what is sent to the browser.
export const blurredPhoto = (target) => sharp(target).resize(16, 16, { fit: 'cover' }).toBuffer()
  .then((tiny) => sharp(tiny).resize(480, 480, { kernel: 'cubic' }).blur(22).webp({ quality: 40 }).toBuffer());

export const readCnic = (fileName) => decrypt(fs.readFileSync(path.join(cnicDir(), path.basename(fileName))), 'cnic');

function remove(directory, fileName) {
  if (fileName) fs.rmSync(path.join(directory, path.basename(fileName)), { force: true });
}

export const deleteCnicFile = (fileName) => remove(cnicDir(), fileName);
export const deletePhotoFile = (fileName) => remove(photosDir(), fileName);
export const deleteConsultantPhoto = (fileName) => remove(consultantsDir(), fileName);
