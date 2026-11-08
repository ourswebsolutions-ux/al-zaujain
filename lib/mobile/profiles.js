// Mobile API: submitting, editing and deleting profiles, and the private manage link.
import { claimWithToken } from '../accounts.js';
import { idFromCode } from '../format.js';
import { deleteOwnProfileFor } from '../member-actions.js';
import { editProfileRequest, submitProfileRequest } from '../profile-service.js';
import { getProfile, profileByManageToken } from '../profiles.js';
import { sha256 } from '../security.js';
import { fail, readForm, readJson, requireMember } from './core.js';
import { profilePanel } from './member.js';

const MANAGE_PREFIX = '/manage/';

// Same multipart form as the website: "data" holds the answers as JSON, files sit alongside.
export async function submit(ctx) {
  const result = await submitProfileRequest(await readForm(ctx.request), ctx.user);
  if (!result.ok) fail(result.message, result.status, { errors: result.errors ?? {}, duplicates: result.duplicates });
  const token = result.url?.startsWith(MANAGE_PREFIX) ? result.url.slice(MANAGE_PREFIX.length) : null;
  return { code: result.code, manageToken: ctx.user?.role === 'user' ? null : token, message: 'Your profile has been received. Our team will review it shortly.' };
}

export async function edit(ctx) {
  const profile = await getProfile(idFromCode(ctx.params.code));
  if (!profile) fail('Profile not found.', 404);
  const result = await editProfileRequest(await readForm(ctx.request), profile, ctx.user);
  if (!result.ok) fail(result.message, result.status, { errors: result.errors ?? {} });
  return { code: result.code, reviewRequired: result.reviewRequired, message: result.reviewRequired ? 'Saved. Our team will review the change before it goes live.' : 'Saved.' };
}

export async function remove(ctx) {
  const { token } = await readJson(ctx.request);
  const result = await deleteOwnProfileFor(ctx.user, ctx.params.code, typeof token === 'string' ? token : null);
  if (!result.ok) fail(result.message, result.status);
  return { message: 'The profile has been deleted.' };
}

async function byToken(token) {
  const profile = await profileByManageToken(sha256(String(token ?? '')));
  if (!profile) fail('This private link is not valid. Please check it and try again.', 404);
  return profile;
}

// The page behind the private link the bureau emails after a submission without an account.
export async function manage(ctx) {
  const profile = await byToken(ctx.params.token);
  return profilePanel(profile, { token: ctx.params.token, lang: ctx.query.get('lang') === 'ur' ? 'ur' : 'en' });
}

export async function claim(ctx) {
  const user = requireMember(ctx);
  await byToken(ctx.params.token);
  const { count } = await claimWithToken(user.id, ctx.params.token);
  return { claimed: count > 0, message: count > 0 ? 'The profile has been added to your account.' : 'This profile is already linked to an account.' };
}
