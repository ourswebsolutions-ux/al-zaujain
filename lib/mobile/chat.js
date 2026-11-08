// Mobile API: the inbox. The same rules as the website chat (lib/chat.js) decide who may write.
import { INBOX_LOCKED } from '../access-text.js';
import { chatBlockReason, chatEnabled, conversationFor, fetchMessages, isBlockedBy, listConversations, sendMessageAs } from '../chat.js';
import { getDb } from '../db.js';
import { startChatFor, setBlockFor } from '../member-actions.js';
import { fail, readJson, requireMember } from './core.js';

export async function conversations(ctx) {
  const user = requireMember(ctx);
  return { enabled: await chatEnabled(), conversations: await listConversations(user.id) };
}

export async function start(ctx) {
  const user = requireMember(ctx);
  const { code } = await readJson(ctx.request);
  const result = await startChatFor(user, String(code ?? ''));
  if (!result.ok) fail(result.message, 403, { upgrade: !!result.upgrade });
  return { conversationId: result.conversationId };
}

async function load(ctx) {
  const user = requireMember(ctx);
  const conversation = await conversationFor(Number(ctx.params.id), user.id);
  if (!conversation) fail('Conversation not found.', 404);
  const otherId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
  return { user, conversation, otherId };
}

export async function thread(ctx) {
  const { user, conversation, otherId } = await load(ctx);
  const after = Number(ctx.query.get('after')) || 0;
  const [other, blockedByMe, messages, blocked] = await Promise.all([
    getDb().user.findUnique({ where: { id: otherId }, select: { name: true } }),
    isBlockedBy(user.id, otherId),
    fetchMessages(conversation.id, user.id, after),
    chatBlockReason(user, otherId),
  ]);
  return { id: conversation.id, me: user.id, otherId, otherName: other?.name ?? '', blockedByMe, blocked, upgrade: blocked === INBOX_LOCKED, messages };
}

export async function send(ctx) {
  const { user, conversation, otherId } = await load(ctx);
  const { body } = await readJson(ctx.request);
  const result = await sendMessageAs(user, conversation.id, otherId, body);
  if (!result.ok) fail(result.message, result.status, result.upgrade ? { upgrade: true } : {});
  return { message: result.message };
}

export async function block(ctx) {
  const { user, conversation, otherId } = await load(ctx);
  const { blocked } = await readJson(ctx.request);
  await setBlockFor(user, conversation.id, otherId, !!blocked);
  return { blockedByMe: await isBlockedBy(user.id, otherId) };
}
