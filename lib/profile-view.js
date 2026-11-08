// Everything one viewer may see on one proposal page. The website's /profile page and the mobile app
// both read it from here, so locks, contact details and photos follow exactly the same rules.
import { canManageProfile } from './access.js';
import { chatEnabled } from './chat.js';
import { isSaved, recordProfileView } from './engagement.js';
import { profileCode } from './format.js';
import { approvedProfileOf, getWeights, matchScore } from './matching.js';
import { biodata } from './profile-schema.js';
import { profilePhotos } from './profiles.js';
import { contactFor, getRestrictions, profileLocks, viewerIsPaid } from './restrictions.js';
import { getSettings } from './settings.js';

const whatsappLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// Returns null when this viewer may not open the profile at all.
export async function profileView(profile, user, ip) {
  if (!profile) return null;
  const manager = await canManageProfile(user, profile);
  if (profile.status !== 'approved' && !manager) return null;
  if (profile.status === 'approved') await recordProfileView(profile, user, ip);

  const settings = await getSettings();
  const label = profileCode(profile.id);
  const [restrictions, paid] = await Promise.all([getRestrictions(), viewerIsPaid(user)]);
  const memberPaid = user?.role === 'user' && paid;
  const locks = profileLocks(profile, { restrictions, paid, manager });
  const isPublic = profile.access_type === 'public';
  const options = { fullName: isPublic || (memberPaid && !locks.premium), hideOther: locks.other };
  const contact = await contactFor(profile, user, restrictions, memberPaid);
  const data = { ...biodata(profile, label, options), contact: contact.rows };

  const allPhotos = manager || profile.photo_public ? await profilePhotos(profile.id) : [];
  const photoLocked = locks.photo && allPhotos.length > 0;
  const photos = photoLocked ? allPhotos.slice(0, 1) : allPhotos;
  const isOwner = !!user && profile.user_id === user.id;
  const live = profile.status === 'approved';
  const canChat = (await chatEnabled()) && !!profile.user_id && !isOwner && live && !locks.premium;
  const viewerProfile = user && !isOwner ? await approvedProfileOf(user.id) : null;
  const yourScore = viewerProfile && viewerProfile.gender !== profile.gender ? matchScore(viewerProfile, profile, await getWeights()) : null;
  const canSave = user?.role === 'user' && !isOwner && live;

  return {
    label, data, locks, contact, options, photos, photoLocked, isOwner, live, canChat, canSave, yourScore,
    saved: canSave ? await isSaved(user.id, profile.id) : false,
    whatsapp: whatsappLink(settings.site_whatsapp, `Assalam-o-Alaikum, I am interested in proposal ${label}.`),
    premiumWhatsapp: whatsappLink(settings.site_whatsapp, `Assalam-o-Alaikum, I am interested in premium proposal ${label}.`),
  };
}
