// The contact form: used by the website's server action and by the mobile app.
import { z } from 'zod';
import { clientIp } from './auth.js';
import { getDb } from './db.js';
import { sendTemplate } from './mail.js';
import { logActivity, rateLimit } from './security.js';
import { getSetting } from './settings.js';

const FIELDS = ['name', 'phone', 'profile_for', 'city', 'message', 'profile_code'];

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z.string().trim().regex(/^[+0-9\s()-]{7,20}$/, 'Please enter a valid phone number'),
  profile_for: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1500).optional(),
  profile_code: z.string().trim().max(20).optional(),
});

// `read(key)` returns the submitted value for one field.
export async function submitEnquiryValues(read, { source = null } = {}) {
  const parsed = enquirySchema.safeParse(Object.fromEntries(FIELDS.map((key) => {
    const value = read(key);
    return [key, typeof value === 'string' && value !== '' ? value : undefined];
  })));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!(await rateLimit(`enquiry:${await clientIp()}`, 5, 3600))) return { ok: false, message: 'Too many enquiries. Please try again later or contact us on WhatsApp.' };

  const data = parsed.data;
  const enquiry = await getDb().enquiry.create({ data: { name: data.name, phone: data.phone, profile_for: data.profile_for ?? null, city: data.city ?? null, message: data.message ?? null, profile_code: data.profile_code ?? null } });
  await logActivity(null, 'enquiry_received', `enquiry:${enquiry.id}`, source);

  const adminEmail = await getSetting('admin_notify_email');
  if (adminEmail) {
    await sendTemplate('enquiry_admin', adminEmail, { name: data.name, phone: data.phone, city: data.city ?? '', profile_for: data.profile_for ?? '', message: data.message ?? '' });
  }
  return { ok: true, message: 'Thank you. Your enquiry has been sent and our team will contact you soon.' };
}
