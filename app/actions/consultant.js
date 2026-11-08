'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireConsultant } from '@/lib/auth.js';
import { chatBlockReason, openConversation } from '@/lib/chat.js';
import { getDb } from '@/lib/db.js';
import { getProfile } from '@/lib/profiles.js';
import { reviewProfile } from '@/lib/review.js';
import { logActivity } from '@/lib/security.js';
import { deleteConsultantPhoto, saveConsultantPhoto, UploadError } from '@/lib/uploads.js';

const refresh = () => revalidatePath('/consultant', 'layout');

async function assignedProfile(form) {
  const { user, consultant } = await requireConsultant();
  const profile = await getProfile(Number(form.get('id')));
  if (!profile || profile.consultant_id !== consultant.id) redirect('/consultant/profiles');
  return { user, consultant, profile };
}

export async function consultantApprove(form) {
  const { user, consultant, profile } = await assignedProfile(form);
  if (!consultant.perm_review) return;
  await reviewProfile(profile.id, 'approved', null, user.id);
  refresh();
}

export async function consultantReject(form) {
  const { user, consultant, profile } = await assignedProfile(form);
  if (!consultant.perm_review) return;
  await reviewProfile(profile.id, 'rejected', String(form.get('reason') ?? ''), user.id);
  refresh();
}

export async function createProposal(form) {
  const { user, consultant, profile } = await assignedProfile(form);
  if (!consultant.perm_proposals) return;
  const other = await getProfile(Number(form.get('other_id')));
  if (!other || other.status !== 'approved') return;
  const [a, b] = profile.id < other.id ? [profile.id, other.id] : [other.id, profile.id];
  await getDb().matchProposal.createMany({ data: [{ consultant_id: consultant.id, profile_a_id: a, profile_b_id: b, note: String(form.get('note') ?? '').trim().slice(0, 500) || null }], skipDuplicates: true });
  await logActivity(user.id, 'proposal_created', `${a}:${b}`);
  refresh();
}

export async function updateProposal(form) {
  const { consultant } = await requireConsultant();
  const status = form.get('status');
  if (!['suggested', 'shared', 'accepted', 'declined'].includes(status)) return;
  await getDb().matchProposal.updateMany({ where: { id: Number(form.get('id')), consultant_id: consultant.id }, data: { status } });
  refresh();
}

export async function messageClient(form) {
  const { user, consultant, profile } = await assignedProfile(form);
  if (!consultant.perm_chat || !profile.user_id) return;
  if (await chatBlockReason(user, profile.user_id)) return;
  redirect(`/messages/${await openConversation(user.id, profile.user_id)}`);
}

export async function saveOwnProfile(_previous, form) {
  const { consultant } = await requireConsultant();
  const schema = z.object({
    title: z.string().trim().max(120), bio: z.string().trim().max(2000), phone: z.string().trim().max(30),
    whatsapp: z.string().trim().regex(/^\d{0,20}$/, 'WhatsApp must be digits only'), city: z.string().trim().max(80), languages: z.string().trim().max(160),
  });
  const parsed = schema.safeParse(Object.fromEntries(['title', 'bio', 'phone', 'whatsapp', 'city', 'languages'].map((key) => [key, form.get(key) ?? ''])));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  let photo = consultant.photo;
  const file = form.get('photo');
  if (file?.size > 0) {
    try {
      photo = await saveConsultantPhoto(file);
      deleteConsultantPhoto(consultant.photo);
    } catch (error) {
      if (error instanceof UploadError) return { ok: false, message: error.message };
      throw error;
    }
  }
  await getDb().consultant.update({ where: { id: consultant.id }, data: { ...parsed.data, photo } });
  refresh();
  return { ok: true, message: 'Your profile has been saved.' };
}
