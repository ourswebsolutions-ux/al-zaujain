// Mobile API: the member dashboard. Each handler mirrors one page under /dashboard on the website.
import { activePackages, CreditError, creditSummary, packageView, unlockCost, unlockProfile } from '../credits.js';
import { memberOverview, memberProfiles, primaryProfile } from '../dashboard.js';
import { recentViewers, savedCodes, savedProfiles, viewStats } from '../engagement.js';
import { ageFromDob, formatDate, idFromCode, profileCode } from '../format.js';
import { makeT } from '../i18n/core.js';
import { matchesForUser } from '../matching.js';
import { PARTNER_FIELDS, savePartnerFor, toggleSavedFor } from '../member-actions.js';
import { listNotifications, markAllRead, markRead } from '../notifications.js';
import { activePaymentMethods, memberPaymentState, submitPayment } from '../payments.js';
import { biodata, biodataToText, profileFormValues } from '../profile-schema.js';
import { profilePhotos } from '../profiles.js';
import { getRestrictions, hasPaidAccess, RESTRICTIONS } from '../restrictions.js';
import { getSetting } from '../settings.js';
import { fail, readForm, readJson, requireMember } from './core.js';

const photo = (file, token) => `/media/photos/${file}${token ? `?m=${encodeURIComponent(token)}` : ''}`;
const langOf = (query) => (query.get('lang') === 'ur' ? 'ur' : 'en');

const summary = (profile) => ({
  code: profileCode(profile.id),
  name: profile.display_name,
  status: profile.status,
  rejectionReason: profile.rejection_reason,
  verification: profile.verification_status,
  verificationNote: profile.verification_note,
  completion: profile.completion,
  photo: profile.photos?.[0] ? photo(profile.photos[0].thumb) : null,
  updatedAt: profile.updated_at,
});

export async function dashboard(ctx) {
  const user = requireMember(ctx);
  const { primary, profiles, views, matches, matchCount, saved, unread } = await memberOverview(user);
  return {
    primary: primary ? { ...summary(primary), consultant: primary.consultant ? { name: primary.consultant.display_name, slug: primary.consultant.slug, title: primary.consultant.title } : null } : null,
    profileCount: profiles.length,
    views: { total: views.total, lastWeek: views.lastWeek },
    matchCount,
    matches,
    savedCount: saved.size,
    saved: [...saved],
    unreadMessages: unread,
  };
}

export async function myProfiles(ctx) {
  const user = requireMember(ctx);
  const profiles = await memberProfiles(user.id);
  const primary = primaryProfile(profiles);
  return { profiles: profiles.map(summary), primary: primary ? profileCode(primary.id) : null };
}

// The private "my profile" panel: the full biodata, its review status and the copy-ready text.
// `token` is the private manage link, for profiles submitted without an account.
export async function profilePanel(profile, { token = null, lang = 'en' } = {}) {
  const code = profileCode(profile.id);
  const photos = await profilePhotos(profile.id);
  const data = biodata(profile, code, { publicOnly: false });
  const subtitle = [`${ageFromDob(profile.date_of_birth)} years`, profile.city, profile.country_name, profile.marital_status];
  return {
    profile: {
      code,
      name: profile.display_name,
      status: profile.status,
      rejectionReason: profile.rejection_reason,
      verification: profile.verification_status,
      verificationNote: profile.verification_note,
      photoPublic: profile.photo_public,
      claimed: !!profile.user_id,
      type: profile.access_type,
      city: profile.city,
      country: profile.country_name,
    },
    biodata: data,
    text: biodataToText(data, makeT(lang)),
    subtitle: subtitle.filter(Boolean),
    photos: photos.map((item) => ({ id: item.id, file: photo(item.file, token), thumb: photo(item.thumb, token) })),
    values: profileFormValues(profile),
    sitePhone: await getSetting('site_phone'),
    generatedOn: formatDate(new Date(), lang),
  };
}

async function ownProfile(user, code) {
  const profile = (await memberProfiles(user.id)).find((item) => item.id === idFromCode(code));
  if (!profile) fail('Profile not found.', 404);
  return profile;
}

export async function myProfile(ctx) {
  const user = requireMember(ctx);
  const profile = await ownProfile(user, ctx.params.code);
  return { ...(await profilePanel(profile, { lang: langOf(ctx.query) })), completion: profile.completion, consultant: profile.consultant ? { name: profile.consultant.display_name, slug: profile.consultant.slug, title: profile.consultant.title } : null };
}

export async function matches(ctx) {
  const user = requireMember(ctx);
  const [{ profile, matches: list }, saved] = await Promise.all([matchesForUser(user.id, 24), savedCodes(user.id)]);
  return { forName: profile?.display_name ?? null, hasProfile: !!profile, matches: list, saved: [...saved] };
}

export async function saved(ctx) {
  const user = requireMember(ctx);
  return { profiles: await savedProfiles(user.id) };
}

export async function setSaved(ctx) {
  const user = requireMember(ctx);
  const body = await readJson(ctx.request);
  const result = await toggleSavedFor(user, String(body.code ?? ''), !!body.saved);
  if (!result.ok) fail(result.message, 422);
  return { saved: result.saved };
}

export async function views(ctx) {
  const user = requireMember(ctx);
  const ids = (await memberProfiles(user.id)).map((profile) => profile.id);
  if (ids.length === 0) return { hasProfile: false, total: 0, lastWeek: 0, daily: [], viewers: [] };
  const [stats, viewers] = await Promise.all([viewStats(ids), recentViewers(ids)]);
  return { hasProfile: true, total: stats.total, lastWeek: stats.lastWeek, daily: stats.daily, viewers };
}

export async function notifications(ctx) {
  const user = requireMember(ctx);
  return { notifications: await listNotifications(user.id) };
}

export async function readNotifications(ctx) {
  const user = requireMember(ctx);
  const { id } = await readJson(ctx.request);
  if (id) await markRead(user.id, Number(id));
  else await markAllRead(user.id);
  return {};
}

export async function preferences(ctx) {
  const user = requireMember(ctx);
  const profile = primaryProfile(await memberProfiles(user.id));
  if (!profile) return { code: null, values: {} };
  const values = profileFormValues(profile);
  return { code: profileCode(profile.id), values: Object.fromEntries(PARTNER_FIELDS.map((name) => [name, values[name]])) };
}

export async function savePreferences(ctx) {
  const user = requireMember(ctx);
  const body = await readJson(ctx.request);
  const result = await savePartnerFor(user, String(body.code ?? ''), body.values ?? {});
  if (!result.ok) fail(result.message, 422, { errors: result.errors ?? {} });
  return { message: result.message };
}

// My Payment Status, Submit Payment, Payment History and Unlocked Profile Access, in one call.
export async function payments(ctx) {
  const user = requireMember(ctx);
  const [{ access, state, requests, pending, pendingCredits }, methods, price, restrictions, paid] = await Promise.all([
    memberPaymentState(user.id), activePaymentMethods(), getSetting('access_price'), getRestrictions(), hasPaidAccess(user.id),
  ]);
  return {
    state,
    expiresAt: access?.expires_at ?? null,
    pending: !!pending,
    pendingCredits: !!pendingCredits,
    price: price || null,
    staff: user.role !== 'user',
    methods: methods.map(({ id, name, account_holder, bank_name, iban, account_number, instructions, qr_image }) => ({ id, name, account_holder, bank_name, iban, account_number, instructions, qr: qr_image ? `/media/payments/${qr_image}` : null })),
    requests: requests.map((request) => ({ id: request.id, package: request.package_name, credits: request.credits, method: request.method_name, amount: Number(request.amount).toLocaleString('en-PK'), transactionId: request.transaction_id, status: request.status, createdAt: request.created_at, receipt: `/api/payments/${request.id}/receipt` })),
    access: RESTRICTIONS.map((item) => ({ key: item.key, label: item.label, open: paid || !restrictions[item.key] })),
  };
}

// Premium Credits: balance, history, unlocked profiles, purchases and the packages on sale.
export async function credits(ctx) {
  const user = requireMember(ctx);
  const [summary, packages, cost, { pendingCredits }] = await Promise.all([creditSummary(user.id), activePackages(), unlockCost(), memberPaymentState(user.id)]);
  return {
    balance: summary.balance,
    purchased: summary.purchased,
    used: summary.used,
    unlockCost: cost,
    packages: packages.map(packageView),
    pending: pendingCredits ? { id: pendingCredits.id, package: pendingCredits.package_name, credits: pendingCredits.credits } : null,
    unlocks: summary.unlocks.map((row) => ({ ...row, photo: row.photo ? `/media/photos/${row.photo}` : null })),
    purchases: summary.purchases.map((row) => ({ id: row.id, package: row.package_name, credits: row.credits, amount: Number(row.amount).toLocaleString('en-PK'), status: row.status, createdAt: row.created_at, receipt: `/api/payments/${row.id}/receipt` })),
    transactions: summary.transactions.map(({ id, kind, amount, balance_after, reference, note, created_at }) => ({ id, kind, amount, balance: balance_after, reference, note, createdAt: created_at })),
  };
}

// Unlocks a Premium profile with credits. The server checks everything and charges once.
export async function unlock(ctx) {
  const user = requireMember(ctx);
  try {
    const result = await unlockProfile(user, idFromCode(ctx.params.code));
    return { ...result, message: result.charged ? 'Profile unlocked. {charged} used, {balance} credits left.' : 'This profile is already unlocked for you.' };
  } catch (error) {
    if (error instanceof CreditError) fail(error.message, error.code === 'insufficient' ? 402 : 422, { insufficient: error.code === 'insufficient' });
    throw error;
  }
}

export async function submitPaymentRequest(ctx) {
  const user = requireMember(ctx);
  if (user.role !== 'user') fail('Staff accounts do not need to pay.', 403);
  const result = await submitPayment(await readForm(ctx.request), user);
  if (!result.ok) fail(result.message, result.status);
  return { id: result.id, message: 'Payment received. Our team will review it shortly.' };
}
