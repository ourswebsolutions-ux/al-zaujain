import { currentUser } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { logActivity } from '@/lib/security.js';
import { readReceipt } from '@/lib/uploads.js';

// Only the member who paid and administrators. Anyone else gets the same answer as a missing file.
export async function GET(_request, { params }) {
  const user = await currentUser();
  const { id } = await params;
  const payment = user ? await getDb().paymentRequest.findUnique({ where: { id: Number(id) || 0 } }) : null;
  if (!payment || !(user.role === 'admin' || payment.user_id === user.id)) return new Response('Not found', { status: 404 });
  if (user.role === 'admin') await logActivity(user.id, 'receipt_viewed', `payment:${payment.id}`);
  return new Response(readReceipt(payment.receipt_file), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store, private', 'Content-Disposition': 'inline', 'X-Robots-Tag': 'noindex' } });
}
