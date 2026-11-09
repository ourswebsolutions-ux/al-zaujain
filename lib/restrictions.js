// The single place that decides what a viewer may see. Every page and route asks here.
import { canSeeContact } from './access.js';
import { getDb } from './db.js';
import { getSettings } from './settings.js';

export const RESTRICTIONS = [
  { key: 'photo', setting: 'restrict_photo', fallback: '0', label: 'Profile photograph', text: 'Unpaid visitors see a heavily blurred photo.' },
  { key: 'phone', setting: 'restrict_phone', fallback: '1', label: 'Contact number', text: 'Phone numbers are only shown after payment.' },
  { key: 'email', setting: 'restrict_email', fallback: '1', label: 'Email address', text: 'Email addresses are only shown after payment.' },
  { key: 'whatsapp', setting: 'restrict_whatsapp', fallback: '1', label: 'WhatsApp contact', text: 'WhatsApp numbers are only shown after payment.' },
  { key: 'inbox', setting: 'restrict_inbox', fallback: '0', label: 'Inbox and direct messages', text: 'Unpaid members cannot send messages.' },
  { key: 'other', setting: 'restrict_other', fallback: '0', label: 'Other private information', text: 'Income, family background and family location are only shown after payment.' },
];

export const restrictionsFrom = (settings) => Object.fromEntries(RESTRICTIONS.map((item) => [item.key, (settings[item.setting] ?? item.fallback) === '1']));

export const getRestrictions = async () => restrictionsFrom(await getSettings());

const isCurrent = (access) => !!access?.active && (!access.expires_at || access.expires_at > new Date());

export async function hasPaidAccess(userId) {
  if (!userId) return false;
  return isCurrent(await getDb().memberAccess.findUnique({ where: { user_id: userId } }));
}

// Staff always have full access. Paid status comes from the database on every check.
export async function viewerIsPaid(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'consultant') return true;
  return hasPaidAccess(user.id);
}

export const PROFILE_TYPES = ['public', 'paid', 'premium'];

// What stays locked for one viewer on one profile.
// Public: nothing. Paid: the admin's restrictions until the viewer pays.
// Premium: the same photo rules, but contact details never open through ordinary payment.
// `unlocked` means this member opened this paid profile with premium credits.
export function profileLocks(profile, { restrictions, paid, manager, unlocked = false }) {
  const none = { photo: false, whatsapp: false, other: false, premium: false };
  if (manager || unlocked) return none;
  if (profile.access_type === 'public') return none;
  const premium = profile.access_type === 'premium';
  return { photo: restrictions.photo && !paid, whatsapp: !premium && restrictions.whatsapp && !paid, other: restrictions.other && !paid, premium };
}

// Returns only the contact rows this viewer may receive, so nothing else is ever sent to the browser.
export async function contactFor(profile, user, restrictions, paid, unlocked = false) {
  const items = [['phone', 'Phone', profile.contact_phone], ['whatsapp', 'WhatsApp', profile.contact_whatsapp], ['email', 'Email', profile.contact_email]].filter(([, , value]) => value);
  if (await canSeeContact(user, profile)) return { rows: items.map(([, label, value]) => ({ label, value })), locked: [] };
  // A public profile is open to everyone. A premium one is only ever introduced through the bureau.
  if (profile.access_type === 'public') return { rows: items.map(([, label, value]) => ({ label, value })), locked: [] };
  if (profile.access_type === 'premium') return { rows: [], locked: [] };
  // A paid profile this member unlocked with credits shows every contact detail it has.
  if (unlocked && user?.role === 'user') return { rows: items.map(([, label, value]) => ({ label, value })), locked: [] };
  // Contact details are never shown to anonymous visitors, even with a restriction switched off.
  const member = user?.role === 'user';
  const allowed = ([key]) => member && (!restrictions[key] || paid);
  return {
    rows: items.filter(allowed).map(([, label, value]) => ({ label, value })),
    locked: items.filter((item) => !allowed(item)).map(([, label]) => label),
  };
}
