import { getDb } from './db.js';

export const consultantOf = async (user) => (user?.role === 'consultant' ? getDb().consultant.findUnique({ where: { user_id: user.id } }) : null);

const isAssigned = (consultant, profile) => !!consultant && profile.consultant_id === consultant.id;

// Who may see a profile's private fields and non-public photos.
export async function canManageProfile(user, profile) {
  if (!user || !profile) return false;
  if (user.role === 'admin' || profile.user_id === user.id) return true;
  return isAssigned(await consultantOf(user), profile);
}

export async function canEditProfile(user, profile) {
  if (!user || !profile) return false;
  if (user.role === 'admin' || profile.user_id === user.id) return true;
  const consultant = await consultantOf(user);
  return isAssigned(consultant, profile) && consultant.perm_edit;
}

export async function canSeeContact(user, profile) {
  if (!user || !profile) return false;
  if (user.role === 'admin' || profile.user_id === user.id) return true;
  const consultant = await consultantOf(user);
  return isAssigned(consultant, profile) && consultant.perm_contact;
}
