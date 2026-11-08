import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/db.js';
import { paymentImageDir } from '@/lib/uploads.js';

export async function GET(_request, { params }) {
  const { file } = await params;
  if (!/^[\w-]+\.webp$/.test(file)) return new Response('Not found', { status: 404 });
  const method = await getDb().paymentMethod.findFirst({ where: { qr_image: file, active: true }, select: { id: true } });
  const target = path.join(paymentImageDir(), file);
  if (!method || !fs.existsSync(target)) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(target), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=300' } });
}
