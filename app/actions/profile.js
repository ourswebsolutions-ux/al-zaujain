'use server';

import { redirect } from 'next/navigation';
import { currentUser, requireUser } from '@/lib/auth.js';
import { deleteOwnProfileFor, setBlockFor, startChatFor } from '@/lib/member-actions.js';

export async function deleteOwnProfile(formData) {
  const token = formData.get('token');
  const code = String(formData.get('code') ?? '');
  if (typeof token === 'string' && token) {
    const result = await deleteOwnProfileFor(null, code, token);
    redirect(result.ok ? '/?notice=profile-deleted' : '/');
  }
  const result = await deleteOwnProfileFor(await currentUser() ?? await requireUser(), code, null);
  if (!result.ok && result.status === 404) redirect('/');
  redirect('/dashboard');
}

export async function startChat(_previous, formData) {
  const code = String(formData.get('code') ?? '');
  const user = await requireUser(`/profile/${code}`);
  const result = await startChatFor(user, code);
  if (!result.ok) return result;
  redirect(`/messages/${result.conversationId}`);
}

export async function toggleBlock(formData) {
  const user = await requireUser('/messages');
  const conversationId = Number(formData.get('conversation'));
  await setBlockFor(user, conversationId, Number(formData.get('other')), formData.get('blocked') === '1');
  redirect(`/messages/${conversationId}`);
}
