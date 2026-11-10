// Premium profile credits: the only module that changes a member's credit balance.
//
// Every change happens inside one database transaction together with a ledger row in
// credit_transactions, so the balance and its history always agree. The balance is changed with a
// conditional UPDATE, and the database also refuses a negative balance (CHECK constraint).
import { getDb } from './db.js';
import { profileCode } from './format.js';
import { notify } from './notifications.js';
import { logActivity } from './security.js';
import { getSetting } from './settings.js';

export class CreditError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// Paid profiles are the ones opened with credits. Free (public) profiles never cost credits, and
// premium profiles stay introduced personally through the bureau.
export const unlockableType = (type) => type === 'paid';

// Overseas (any country but Pakistan) profiles open only with a Foreign package, like the reference's
// Local and International packages. Profiles without a country count as Pakistan.
export const isForeignCountry = (name) => !!name && name !== 'Pakistan';

export async function hasForeignAccess(userId) {
  if (!userId) return false;
  return !!(await getDb().user.findUnique({ where: { id: userId }, select: { foreign_access: true } }))?.foreign_access;
}

export async function unlockCost() {
  const value = Number(await getSetting('unlock_credit_cost'));
  return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 1;
}

export async function creditBalance(userId) {
  if (!userId) return 0;
  return (await getDb().user.findUnique({ where: { id: userId }, select: { credits: true } }))?.credits ?? 0;
}

export async function hasUnlocked(userId, profileId) {
  if (!userId || !profileId) return false;
  return !!(await getDb().profileUnlock.findUnique({ where: { user_id_profile_id: { user_id: userId, profile_id: profileId } }, select: { id: true } }));
}

export async function unlockedCodes(userId) {
  if (!userId) return new Set();
  const rows = await getDb().profileUnlock.findMany({ where: { user_id: userId }, select: { profile_id: true } });
  return new Set(rows.map((row) => profileCode(row.profile_id)));
}

// Adds or removes credits with a ledger row. Run inside an existing transaction (tx).
async function move(tx, userId, amount, { kind, reference = null, note = null, actorId = null }) {
  const changed = amount >= 0
    ? await tx.user.updateMany({ where: { id: userId }, data: { credits: { increment: amount } } })
    : await tx.user.updateMany({ where: { id: userId, credits: { gte: -amount } }, data: { credits: { decrement: -amount } } });
  if (changed.count === 0) throw new CreditError('Not enough credits.', 'insufficient');
  const { credits } = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return tx.creditTransaction.create({ data: { user_id: userId, kind, amount, balance_after: credits, reference, note: note?.slice(0, 500) ?? null, actor_id: actorId } });
}

/**
 * Opens a paid profile for a member, once. Returns { unlocked, charged, balance }.
 * The unique (user, profile) row is written first, so two taps at the same moment cannot both pay:
 * the second waits for the first, then finds the profile already unlocked.
 */
export async function unlockProfile(user, profileId) {
  const db = getDb();
  if (user?.role !== 'user') throw new CreditError('Please sign in with a member account to unlock profiles.', 'member');
  const profile = await db.profile.findUnique({ where: { id: profileId }, select: { id: true, status: true, access_type: true, user_id: true, country: { select: { name: true } } } });
  if (!profile || profile.status !== 'approved') throw new CreditError('This proposal is not available.', 'missing');
  if (profile.user_id === user.id) throw new CreditError('This is your own profile.', 'own');
  if (!unlockableType(profile.access_type)) throw new CreditError(profile.access_type === 'public' ? 'This is a free profile. It does not need credits.' : 'This premium proposal is introduced personally by our consultants.', 'not_paid');
  if (isForeignCountry(profile.country?.name) && !(await hasForeignAccess(user.id)) && !(await hasUnlocked(user.id, profile.id))) {
    throw new CreditError('This is an overseas profile. Overseas profiles open with the International (Foreign) package.', 'foreign');
  }
  const cost = await unlockCost();
  try {
    const result = await withRetry(() => db.$transaction(async (tx) => {
      // Lock this member's row first, so their unlocks run one after another and cannot deadlock.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const existing = await tx.profileUnlock.findUnique({ where: { user_id_profile_id: { user_id: user.id, profile_id: profile.id } } });
      if (existing) return { charged: 0 };
      await tx.profileUnlock.create({ data: { user_id: user.id, profile_id: profile.id, credits: cost } });
      const row = await move(tx, user.id, -cost, { kind: 'unlock', reference: profileCode(profile.id), note: 'Profile unlocked' });
      return { charged: cost, balance: row.balance_after };
    }, { timeout: 15000 }));
    if (result.charged) await logActivity(user.id, 'profile_unlocked', profileCode(profile.id), `${cost} credit${cost === 1 ? '' : 's'}`);
    return { unlocked: true, charged: result.charged, balance: result.balance ?? (await creditBalance(user.id)) };
  } catch (error) {
    // A simultaneous unlock of the same profile finished first: it is open and was paid once.
    if (error?.code === 'P2002' || /Duplicate entry|unique constraint/i.test(String(error?.message))) {
      return { unlocked: true, charged: 0, balance: await creditBalance(user.id) };
    }
    if (error instanceof CreditError || /Not enough credits/.test(String(error?.message))) {
      throw new CreditError(cost === 1 ? 'You need 1 credit to unlock this profile. Please buy a premium credit package.' : `You need ${cost} credits to unlock this profile. Please buy a premium credit package.`, 'insufficient');
    }
    throw error;
  }
}

// The database cancels one side of a rare write conflict and asks for a retry; nothing was saved by it.
const isConflict = (error) => error?.code === 'P2034' || /deadlock|write conflict|try restarting transaction/i.test(String(error?.message));
async function withRetry(run, attempts = 5) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isConflict(error) || attempt >= attempts) throw error;
      await new Promise((resolve) => { setTimeout(resolve, 20 * attempt + Math.random() * 30); });
    }
  }
}

export async function addPurchasedCredits(tx, payment, actorId) {
  // A Foreign package opens overseas profiles for good, on top of its credits.
  if (payment.package_scope === 'foreign') await tx.user.update({ where: { id: payment.user_id }, data: { foreign_access: true } });
  return move(tx, payment.user_id, payment.credits, { kind: 'purchase', reference: `payment:${payment.id}`, note: `${payment.package_name ?? 'Credit package'} (${payment.credits} credits)`, actorId });
}

// The administrator's manual correction. A reason is required and kept in the ledger and the audit log.
export async function adjustCredits(userId, amount, reason, actorId) {
  const change = Math.trunc(Number(amount));
  const why = String(reason ?? '').trim();
  if (!change || Math.abs(change) > 100000) throw new CreditError('Enter a whole number of credits to add or remove.', 'amount');
  if (why.length < 3) throw new CreditError('A reason is required for every manual adjustment.', 'reason');
  try {
    const row = await withRetry(() => getDb().$transaction((tx) => move(tx, userId, change, { kind: 'adjustment', note: why, actorId })));
    await logActivity(actorId, 'credits_adjusted', `user:${userId}`, `${change > 0 ? '+' : ''}${change}: ${why}`);
    await notify(userId, { type: 'payment', title: change > 0 ? `${change} premium credits added` : `${-change} premium credits removed`, body: why, href: '/dashboard/credits' });
    return row;
  } catch (error) {
    if (error instanceof CreditError) throw new CreditError('This would leave the member with fewer than 0 credits.', 'insufficient');
    throw error;
  }
}

// Closes an unlock (for example after a complaint). With refund, the credits go back to the member.
export async function revokeUnlock(unlockId, refund, actorId) {
  const db = getDb();
  const unlock = await db.profileUnlock.findUnique({ where: { id: unlockId } });
  if (!unlock) return null;
  await db.$transaction(async (tx) => {
    await tx.profileUnlock.delete({ where: { id: unlock.id } });
    if (refund && unlock.credits > 0) await move(tx, unlock.user_id, unlock.credits, { kind: 'refund', reference: profileCode(unlock.profile_id), note: 'Unlock removed by the bureau, credits returned', actorId });
  });
  await logActivity(actorId, 'profile_unlock_revoked', profileCode(unlock.profile_id), `user:${unlock.user_id}${refund ? `, refunded ${unlock.credits}` : ''}`);
  return unlock;
}

// Everything the member's Premium Credits page shows.
export async function creditSummary(userId) {
  const db = getDb();
  const [user, totals, transactions, unlocks, purchases] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    db.creditTransaction.groupBy({ by: ['kind'], where: { user_id: userId }, _sum: { amount: true } }),
    db.creditTransaction.findMany({ where: { user_id: userId }, orderBy: { id: 'desc' }, take: 100 }),
    db.profileUnlock.findMany({
      where: { user_id: userId },
      orderBy: { id: 'desc' },
      take: 200,
      select: { id: true, credits: true, created_at: true, profile: { select: { id: true, display_name: true, city: true, status: true, photos: { select: { thumb: true }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], take: 1 } } } },
    }),
    db.paymentRequest.findMany({ where: { user_id: userId, package_id: { not: null } }, orderBy: { id: 'desc' }, take: 100 }),
  ]);
  const sum = (kind) => totals.find((row) => row.kind === kind)?._sum.amount ?? 0;
  return {
    balance: user?.credits ?? 0,
    purchased: sum('purchase') + Math.max(0, sum('adjustment')),
    used: -sum('unlock') - sum('refund'),
    transactions,
    unlocks: unlocks.map((row) => ({ id: row.id, credits: row.credits, at: row.created_at, code: profileCode(row.profile.id), name: row.profile.display_name, city: row.profile.city, live: row.profile.status === 'approved', photo: row.profile.photos[0]?.thumb ?? null })),
    purchases,
  };
}

// Puts the member's live proposals at the top of search for the paid days. A boost bought while one is
// still running adds its days to the end; a Super Boost also lifts a running Boost to Super.
export async function applyBoost(tx, payment) {
  const rank = payment.super_boost ? 2 : 1;
  const days = Math.max(1, Number(payment.boost_days) || 0);
  const now = new Date();
  const profiles = await tx.profile.findMany({ where: { user_id: payment.user_id, status: 'approved' }, select: { id: true, boost_rank: true, boosted_until: true } });
  for (const profile of profiles) {
    const running = profile.boost_rank > 0 && profile.boosted_until > now;
    const from = running ? profile.boosted_until : now;
    await tx.profile.update({ where: { id: profile.id }, data: { boost_rank: Math.max(rank, running ? profile.boost_rank : 0), boosted_until: new Date(from.getTime() + days * 86400000) } });
  }
  return profiles.length;
}

// Boosts end on their date. Run before search orders by boost_rank; cheap thanks to the index.
export async function expireBoosts() {
  await getDb().profile.updateMany({ where: { boost_rank: { gt: 0 }, OR: [{ boosted_until: null }, { boosted_until: { lte: new Date() } }] }, data: { boost_rank: 0 } });
}

// A boost needs a proposal people can see: approved, with its photo shown.
export async function canBoost(userId) {
  return !!(await getDb().profile.findFirst({ where: { user_id: userId, status: 'approved', photo_public: true, photos: { some: {} } }, select: { id: true } }));
}

export const activePackages = () => getDb().creditPackage.findMany({ where: { active: true }, orderBy: [{ featured: 'desc' }, { sort: 'asc' }, { credits: 'asc' }] });

export const packageView = (row) => ({
  id: row.id,
  name: row.name,
  kind: row.kind ?? 'credits',
  scope: row.scope ?? 'local',
  credits: row.credits,
  price: Number(row.price),
  wasPrice: row.was_price == null ? null : Number(row.was_price),
  // "50% OFF" from the price before discount.
  discount: row.was_price && Number(row.was_price) > Number(row.price) ? Math.round((1 - Number(row.price) / Number(row.was_price)) * 100) : 0,
  days: row.days ?? null,
  superBoost: !!row.super_boost,
  color: /^#[0-9a-f]{3,8}$/i.test(row.color ?? '') ? row.color : null,
  audioCall: !!row.audio_call,
  videoCall: !!row.video_call,
  description: row.description,
  featured: row.featured,
});
