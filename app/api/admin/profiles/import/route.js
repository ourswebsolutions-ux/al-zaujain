import { jsonError, sameOrigin } from '@/lib/api.js';
import { currentUser } from '@/lib/auth.js';
import { biodataFingerprint, readBiodataForForm } from '@/lib/biodata-import.js';
import { findDuplicates } from '@/lib/profile-service.js';
import { sha256 } from '@/lib/security.js';

// Reads a pasted biodata into form values. Nothing is saved until the administrator reviews it.
export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const user = await currentUser();
  if (user?.role !== 'admin') return jsonError('Only administrators can import profiles.', 403);
  const read = await readBiodataForForm((await request.json().catch(() => null))?.text);
  if (read.error) return jsonError(read.error, 422);
  const { text, values, unassigned } = read;
  const hash = sha256(biodataFingerprint(text));
  const duplicates = await findDuplicates({ hash, phone: values.contact_phone, name: values.full_name, dob: values.date_of_birth });
  return Response.json({ values, unassigned, hash, duplicates });
}
