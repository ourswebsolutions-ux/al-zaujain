import fs from 'node:fs';
import path from 'node:path';
import { currentUser } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { canManageProfile } from '@/lib/access.js';
import { getProfile } from '@/lib/profiles.js';
import { sha256 } from '@/lib/security.js';
import { hasUnlocked } from '@/lib/credits.js';
import { getRestrictions, viewerIsPaid } from '@/lib/restrictions.js';
import { blurredPhoto, photosDir } from '@/lib/uploads.js';

export async function GET(request, { params }) {
  const { file } = await params;
  if (!/^[\w-]+\.webp$/.test(file)) return new Response('Not found', { status: 404 });
  const row = await getDb().profilePhoto.findFirst({ where: { OR: [{ file }, { thumb: file }] }, select: { profile_id: true } });
  if (!row) return new Response('Not found', { status: 404 });
  const profile = await getProfile(row.profile_id);
  const isPublic = profile.status === 'approved' && profile.photo_public;
  const user = await currentUser();
  const token = request.nextUrl.searchParams.get('m');
  const manager = (token && profile.manage_token_hash === sha256(token)) || (await canManageProfile(user, profile));
  if (!isPublic && !manager) return new Response('Not found', { status: 404 });

  const target = path.join(photosDir(), file);
  if (!fs.existsSync(target)) return new Response('Not found', { status: 404 });

  // The URL never reveals anything: a viewer without access receives different bytes from the same address.
  const { photo: restricted } = await getRestrictions();
  const unlocked = manager || profile.access_type === 'public' || !restricted || (await viewerIsPaid(user)) || (user?.role === 'user' && (await hasUnlocked(user.id, profile.id)));
  if (!unlocked) return new Response(await blurredPhoto(target), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store' } });
  return new Response(fs.readFileSync(target), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store' },
  });
}
