// Approve or reject a profile, from either the admin or a consultant with permission.
import { getDb } from './db.js';
import { profileCode } from './format.js';
import { sendTemplate, siteUrl } from './mail.js';
import { notify } from './notifications.js';
import { getProfile } from './profiles.js';
import { logActivity } from './security.js';

export async function reviewProfile(profileId, decision, reason, actorId) {
  const profile = await getProfile(profileId);
  if (!profile) return;
  const code = profileCode(profile.id);
  const db = getDb();
  if (decision === 'approved') {
    await db.profile.update({ where: { id: profile.id }, data: { status: 'approved', rejection_reason: null, approved_at: profile.approved_at ?? new Date() } });
    await sendTemplate('profile_approved', profile.contact_email, { name: profile.full_name, code, profile_url: `${siteUrl()}/profile/${code}` });
    await notify(profile.user_id, { type: 'profile', title: `Your profile ${code} is approved`, body: 'It now appears in Al Zaujain proposals.', href: `/profile/${code}` });
  } else {
    const why = reason?.trim() || 'Please contact our team for details.';
    await db.profile.update({ where: { id: profile.id }, data: { status: 'rejected', rejection_reason: why, featured: false } });
    await sendTemplate('profile_rejected', profile.contact_email, { name: profile.full_name, code, reason: why });
    await notify(profile.user_id, { type: 'profile', title: `Your profile ${code} needs attention`, body: why.slice(0, 280), href: '/dashboard/profile' });
  }
  await logActivity(actorId, `profile_${decision}`, code);
}
