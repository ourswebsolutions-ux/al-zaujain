import { getDb } from './db.js';
import { recentViewers, savedCodes, viewStats } from './engagement.js';
import { matchesForUser } from './matching.js';
import { profileCompletion } from './profile-schema.js';
import { flattenProfile } from './profiles.js';
import { getSetting } from './settings.js';
import { unreadCount } from './chat.js';

const include = {
  country: { select: { name: true } },
  consultant: { select: { display_name: true, slug: true, photo: true, title: true, user_id: true, perm_chat: true } },
  photos: { orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }] },
  cnic_document: { select: { id: true } },
};

export async function memberProfiles(userId) {
  const rows = await getDb().profile.findMany({ where: { user_id: userId }, include, orderBy: { updated_at: 'desc' } });
  return rows.map((row) => {
    const profile = flattenProfile(row);
    return { ...profile, completion: profileCompletion(profile, { photos: row.photos.length, hasCnic: !!row.cnic_document }) };
  });
}

// The live profile if there is one, otherwise the most recently edited.
export const primaryProfile = (profiles) => profiles.find((profile) => profile.status === 'approved') ?? profiles[0] ?? null;

export async function memberOverview(user) {
  const profiles = await memberProfiles(user.id);
  const ids = profiles.map((profile) => profile.id);
  const [views, viewers, ranked, minScore, saved, unread] = await Promise.all([
    viewStats(ids), recentViewers(ids, 5), matchesForUser(user.id, 400), getSetting('match_min_score'), savedCodes(user.id), unreadCount(user.id),
  ]);
  // The tile counts every proposal above the match threshold, not just those displayed.
  const matchCount = ranked.matches.filter((match) => match.score >= (Number(minScore) || 60)).length;
  return { profiles, primary: primaryProfile(profiles), views, viewers, matches: ranked.matches.slice(0, 3), matchCount, saved, unread };
}
