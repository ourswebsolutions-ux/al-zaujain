import fs from 'node:fs';
import path from 'node:path';
import { homepageDir } from '@/lib/uploads.js';

export async function GET(_request, { params }) {
  const { file } = await params;
  if (!/^[\w-]+\.webp$/.test(file)) return new Response('Not found', { status: 404 });
  const target = path.join(homepageDir(), file);
  if (!fs.existsSync(target)) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(target), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } });
}
