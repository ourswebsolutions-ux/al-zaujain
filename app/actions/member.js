'use server';

import { revalidatePath } from 'next/cache';
import { currentUser, requireUser } from '@/lib/auth.js';
import { savePartnerFor, toggleSavedFor } from '@/lib/member-actions.js';
import { markAllRead, markRead } from '@/lib/notifications.js';

export async function toggleSaved(code, saved) {
  const result = await toggleSavedFor(await currentUser(), code, saved);
  if (!result.ok) return { ok: false };
  revalidatePath('/dashboard', 'layout');
  return { ok: true };
}

export async function readAllNotifications() {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath('/dashboard', 'layout');
}

export async function readNotification(id) {
  const user = await requireUser();
  await markRead(user.id, Number(id));
  revalidatePath('/dashboard', 'layout');
}

export async function savePartnerRequirements(code, values) {
  const user = await requireUser();
  const result = await savePartnerFor(user, code, values);
  if (result.ok) revalidatePath('/dashboard', 'layout');
  return result;
}
