import { jsonError, sameOrigin } from '@/lib/api.js';
import { clientIp } from '@/lib/auth.js';
import { readBiodataForForm } from '@/lib/biodata-import.js';
import { rateLimit } from '@/lib/security.js';

// Members (and visitors on Submit Profile) paste their biodata to fill the form. Nothing is saved here;
// they review every step and submit as usual.
export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  if (!(await rateLimit(`read-biodata:${await clientIp()}`, 30, 3600))) return jsonError('Too many tries. Please wait a while and try again.', 429);
  const read = await readBiodataForForm((await request.json().catch(() => null))?.text);
  if (read.error) return jsonError(read.error, 422);
  return Response.json({ values: read.values, unassigned: read.unassigned });
}
