// Pure helpers, safe in both server and client code.
export const slugify = (text = '') => text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Profile IDs are "AZMB-04": the profile's database number, so every ID is unique and never changes.
// Older links and printouts used "AZ-04"; both forms still find the same profile.
export const profileCode = (id) => `AZMB-${String(id).padStart(2, '0')}`;
export const idFromCode = (code = '') => {
  const match = /^AZ(?:MB)?-?0*(\d{1,10})$/i.exec(String(code).trim());
  return match ? Number(match[1]) : null;
};

// A date of birth arrives as a Date from the database or a yyyy-mm-dd string from a form.
const toDate = (value) => (value instanceof Date ? value : new Date(`${value}T00:00:00Z`));
export const dateInput = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ?? '');

export function ageFromDob(dob, now = new Date()) {
  if (!dob) return null;
  const birth = toDate(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < birth.getUTCMonth()
    || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function heightLabel(cm) {
  if (!cm) return null;
  const inches = Math.round(Number(cm) / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export const firstName = (fullName = '') => fullName.trim().split(/\s+/)[0] || '';

const dateLocale = (lang) => (lang === 'ur' ? 'ur-PK' : 'en-GB');

export function formatDate(value, lang) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(value, lang) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(dateLocale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
}

// A WhatsApp number in the international digits wa.me expects, however it was typed:
// "+92 300 1234567", "0300-1234567", "3001234567" and "0092…" all become "923001234567".
// Returns '' for an empty value and null when it cannot be a phone number.
export function whatsappNumber(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('03')) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('3')) digits = `92${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}
