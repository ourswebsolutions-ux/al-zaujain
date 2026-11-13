import { jsonError, sameOrigin } from '@/lib/api.js';
import { currentUser } from '@/lib/auth.js';
import { biodataFingerprint, parseBiodata } from '@/lib/biodata-import.js';
import { getDb } from '@/lib/db.js';
import { findDuplicates } from '@/lib/profile-service.js';
import { sha256 } from '@/lib/security.js';

const MAX_TEXT = 20000;

// Reads a pasted biodata into form values. Nothing is saved until the administrator reviews it.
export async function POST(request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  const user = await currentUser();
  if (user?.role !== 'admin') return jsonError('Only administrators can import profiles.', 403);
  const text = String((await request.json().catch(() => null))?.text ?? '');
  if (!text.trim()) return jsonError('Paste a biodata first.', 422);
  if (text.length > MAX_TEXT) return jsonError('This text is too long. Please paste one biodata at a time.', 422);

  const { values, unassigned } = parseBiodata(text);
  const db = getDb();
  // Country names become the country list's ids. An unknown country is kept, not lost.
  for (const [field, target] of [['country', 'country_id'], ['origin_country', null], ['pref_country', null]]) {
    if (!values[field]) continue;
    const country = await db.country.findFirst({ where: { name: values[field] }, select: { id: true, name: true } });
    if (target) {
      // A country missing from the list is kept as typed; saving adds it to the list.
      values[target] = country ? country.id : values[field];
      if (!values.origin_country && country) values.origin_country = country.name;
      delete values[field];
    } else if (!country) {
      unassigned.push(`${field === 'pref_country' ? 'Preferred country' : 'Country of origin'}: ${values[field]}`);
      delete values[field];
    }
  }
  const hash = sha256(biodataFingerprint(text));
  const duplicates = await findDuplicates({ hash, phone: values.contact_phone, name: values.full_name, dob: values.date_of_birth });
  return Response.json({ values, unassigned, hash, duplicates });
}
