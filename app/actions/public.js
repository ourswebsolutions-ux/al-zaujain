'use server';

import { submitEnquiryValues } from '@/lib/enquiries.js';

export async function submitEnquiry(_previous, formData) {
  if (formData.get('website')) return { ok: true, message: 'Thank you. Our team will contact you soon.' };
  return submitEnquiryValues((key) => formData.get(key) ?? undefined);
}
