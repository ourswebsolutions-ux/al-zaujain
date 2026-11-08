import { currentUser } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { logActivity } from '@/lib/security.js';
import { readCnic } from '@/lib/uploads.js';
import { profileCode } from '@/lib/format.js';

// Admin only. Decrypts on demand, is never cached, and every view is written to the activity log.
export async function GET(_request, { params }) {
  const user = await currentUser();
  if (user?.role !== 'admin') return new Response('Not found', { status: 404 });
  const { id, side } = await params;
  const document = await getDb().cnicDocument.findUnique({ where: { profile_id: Number(id) } });
  const file = side === 'back' ? document?.back_file : side === 'front' ? document?.front_file : null;
  if (!file) return new Response('Not found', { status: 404 });
  await logActivity(user.id, 'cnic_viewed', profileCode(Number(id)), side);
  return new Response(readCnic(file), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store, private', 'Content-Disposition': 'inline', 'X-Robots-Tag': 'noindex' },
  });
}
