// Pure helpers, safe in both server and client code.
export const slugify = (text = '') => text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const profileCode = (id) => `AZ-${String(id).padStart(2, '0')}`;
export const idFromCode = (code = '') => {
  const match = /^AZ-(\d{1,10})$/i.exec(code);
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
