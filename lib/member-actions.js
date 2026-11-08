// Member actions shared by the website's server actions and the mobile app.
// Each returns { ok, message?, ... }; the caller decides what to do next.
import { INBOX_LOCKED } from './access-text.js';
import { chatBlockReason, conversationFor, openConversation, setBlocked } from './chat.js';
import { setSaved } from './engagement.js';
import { idFromCode, profileCode } from './format.js';
import { profileFormValues, SECTIONS, validateProfile } from './profile-schema.js';
import { deleteProfile, getProfile, updateProfile } from './profiles.js';
import { logActivity, sha256 } from './security.js';

export async function toggleSavedFor(user, code, saved) {
  if (user?.role !== 'user') return { ok: false, message: 'Please sign in with a member account to save proposals.' };
  const profile = await getProfile(idFromCode(code));
  if (!profile || profile.status !== 'approved' || profile.user_id === user.id) return { ok: false, message: 'This proposal cannot be saved.' };
  await setSaved(user.id, profile.id, !!saved);
  return { ok: true, saved: !!saved };
}

export const PARTNER_FIELDS = SECTIONS.find((section) => section.key === 'partner').fields.map((field) => field.name);

// Saves the partner section alone. The demand text is public, so it returns to review like any edit.
export async function savePartnerFor(user, code, values) {
  const profile = await getProfile(idFromCode(code));
  if (!profile || profile.user_id !== user.id) return { ok: false, message: 'Profile not found.' };
  const merged = { ...profileFormValues(profile), ...Object.fromEntries(PARTNER_FIELDS.map((name) => [name, values?.[name] ?? ''])) };
  const result = validateProfile(merged);
  if (!result.ok) {
    const partnerErrors = Object.fromEntries(Object.entries(result.errors).filter(([name]) => PARTNER_FIELDS.includes(name)));
    if (Object.keys(partnerErrors).length) return { ok: false, message: 'Please correct the highlighted fields.', errors: partnerErrors };
    return { ok: false, message: 'Your profile has other incomplete details. Please finish them under Edit Profile first.' };
  }
  await updateProfile(profile.id, result.data, { reviewRequired: true });
  await logActivity(user.id, 'partner_requirements_saved', code);
  return { ok: true, message: 'Saved. Our team will review the change before it goes live.' };
}

// Deleting needs the owner's account or the profile's private manage link.
export async function deleteOwnProfileFor(user, code, token) {
  const profile = await getProfile(idFromCode(code));
  if (!profile) return { ok: false, status: 404, message: 'Profile not found.' };
  const byToken = typeof token === 'string' && !!token && profile.manage_token_hash === sha256(token);
  if (!byToken && (!user || profile.user_id !== user.id)) return { ok: false, status: 403, message: 'You cannot delete this profile.' };
  await deleteProfile(profile.id);
  await logActivity(byToken ? null : user.id, 'profile_deleted_by_owner', profileCode(profile.id));
  return { ok: true };
}

export async function startChatFor(user, code) {
  const profile = await getProfile(idFromCode(code));
  if (!profile?.user_id || profile.status !== 'approved') return { ok: false, message: 'Chat is not available for this proposal. Please contact our team.' };
  if (profile.access_type === 'premium' && user.role === 'user') return { ok: false, message: 'Premium proposals are introduced through our consultants. Please contact Al Zaujain on WhatsApp.' };
  const reason = await chatBlockReason(user, profile.user_id);
  if (reason) return { ok: false, message: reason, upgrade: reason === INBOX_LOCKED };
  return { ok: true, conversationId: await openConversation(user.id, profile.user_id) };
}

export async function setBlockFor(user, conversationId, otherId, blocked) {
  const conversation = await conversationFor(conversationId, user.id);
  if (!conversation || ![conversation.user_low, conversation.user_high].includes(otherId) || otherId === user.id) return { ok: false };
  await setBlocked(user.id, otherId, !!blocked);
  return { ok: true };
}
