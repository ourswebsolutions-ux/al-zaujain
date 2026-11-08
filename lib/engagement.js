// Saved profiles and honest profile-view tracking.
import { getDb } from './db.js';
import { profileCode } from './format.js';
import { CARD_SELECT, toCard } from './profiles.js';
import { signValue } from './security.js';

const DAY = 86400000;
const today = () => new Date(new Date().toISOString().slice(0, 10));

export async function setSaved(userId, profileId, saved) {
  const db = getDb();
  if (saved) await db.savedProfile.createMany({ data: [{ user_id: userId, profile_id: profileId }], skipDuplicates: true });
  else await db.savedProfile.deleteMany({ where: { user_id: userId, profile_id: profileId } });
}

export const isSaved = async (userId, profileId) => !!(await getDb().savedProfile.findUnique({ where: { user_id_profile_id: { user_id: userId, profile_id: profileId } } }));

export async function savedCodes(userId) {
  const rows = await getDb().savedProfile.findMany({ where: { user_id: userId, profile: { status: 'approved' } }, select: { profile_id: true } });
  return new Set(rows.map((row) => profileCode(row.profile_id)));
}

// A saved proposal that has since gone offline stays in the table but is not shown.
export async function savedProfiles(userId) {
  const rows = await getDb().savedProfile.findMany({
    where: { user_id: userId, profile: { status: 'approved' } },
    select: { created_at: true, profile: { select: CARD_SELECT } },
    orderBy: { created_at: 'desc' },
  });
  return rows.map((row) => ({ ...toCard(row.profile), savedAt: row.created_at }));
}

// Counts each visitor once per profile per day. Owners and staff are not counted.
export async function recordProfileView(profile, user, ip) {
  if (user && (user.role !== 'user' || user.id === profile.user_id)) return;
  const db = getDb();
  const viewerKey = user ? `member:${user.id}` : signValue(`view:${ip}`).slice(0, 40);
  const { count } = await db.profileView.createMany({
    data: [{ profile_id: profile.id, viewer_id: user?.id ?? null, viewer_key: viewerKey, view_date: today() }],
    skipDuplicates: true,
  });
  if (count) await db.profile.update({ where: { id: profile.id }, data: { views: { increment: 1 }, updated_at: profile.updated_at } });
}

const dayKey = (date) => date.toISOString().slice(0, 10);

export async function viewStats(profileIds, days = 14) {
  const db = getDb();
  if (profileIds.length === 0) return { total: 0, lastWeek: 0, daily: [], recent: [] };
  const since = new Date(today().getTime() - (days - 1) * DAY);
  const [totals, rows] = await Promise.all([
    db.profile.aggregate({ where: { id: { in: profileIds } }, _sum: { views: true } }),
    db.profileView.groupBy({ by: ['view_date'], where: { profile_id: { in: profileIds }, view_date: { gte: since } }, _count: { id: true } }),
  ]);
  const byDay = new Map(rows.map((row) => [dayKey(row.view_date), row._count.id]));
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * DAY);
    return { date, count: byDay.get(dayKey(date)) ?? 0 };
  });
  return { total: totals._sum.views ?? 0, lastWeek: daily.slice(-7).reduce((sum, day) => sum + day.count, 0), daily };
}

// A viewer is named only if they are a member with a live profile who allows it.
export async function recentViewers(profileIds, take = 30) {
  if (profileIds.length === 0) return [];
  const rows = await getDb().profileView.findMany({
    where: { profile_id: { in: profileIds } },
    select: {
      id: true, created_at: true,
      viewer: { select: { show_in_views: true, profiles: { where: { status: 'approved' }, select: CARD_SELECT, orderBy: { updated_at: 'desc' }, take: 1 } } },
    },
    orderBy: { id: 'desc' },
    take,
  });
  return rows.map((row) => {
    const profile = row.viewer?.show_in_views ? row.viewer.profiles[0] : null;
    return { id: row.id, when: row.created_at, card: profile ? toCard(profile) : null, member: !!row.viewer };
  });
}
