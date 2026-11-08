import { INBOX_LOCKED } from './access-text.js';
import { getDb } from './db.js';
import { notify } from './notifications.js';
import { rateLimit } from './security.js';
import { hasPaidAccess } from './restrictions.js';
import { getSettings } from './settings.js';

export const MAX_MESSAGE = 1000;

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const chatEnabled = async () => (await getSettings()).chat_enabled === '1';

const isBlocked = async (a, b) => !!(await getDb().userBlock.findFirst({ where: { OR: [{ blocker_id: a, blocked_id: b }, { blocker_id: b, blocked_id: a }] } }));

async function isStaffPair(user, other) {
  const roles = [user.role, other.role];
  if (roles.includes('admin')) return true;
  if (!roles.includes('consultant')) return false;
  const [consultantUser, client] = user.role === 'consultant' ? [user, other] : [other, user];
  return !!(await getDb().profile.findFirst({ where: { user_id: client.id, consultant: { user_id: consultantUser.id, perm_chat: true } }, select: { id: true } }));
}

// The one rule every chat path passes through. Returns a reason string when chat is not allowed.
export async function chatBlockReason(user, otherId) {
  const db = getDb();
  const settings = await getSettings();
  if (settings.chat_enabled !== '1') return 'Chat is currently switched off.';
  const other = await db.user.findUnique({ where: { id: otherId }, select: { id: true, role: true, status: true, chat_disabled: true } });
  if (!other || other.status !== 'active') return 'This member is not available.';
  if (other.id === user.id) return 'You cannot message yourself.';
  if (await isBlocked(user.id, other.id)) return 'This conversation is not available.';
  if (user.role === 'admin') return null;
  if (user.chat_disabled) return 'Chat has been restricted on your account. Please contact our team.';
  if (other.chat_disabled) return 'This member cannot receive messages right now.';
  if (await isStaffPair(user, other)) return null;
  if (user.role === 'consultant' || other.role !== 'user') return 'You can only message your assigned clients.';
  if (settings.restrict_inbox === '1' && !(await hasPaidAccess(user.id))) return INBOX_LOCKED;
  if (settings.chat_require_approved === '1') {
    const approved = await db.profile.findFirst({ where: { user_id: user.id, status: 'approved' }, select: { id: true } });
    if (!approved) return 'You need an approved profile before you can start a chat.';
  }
  return null;
}

export async function openConversation(userId, otherId) {
  const [user_low, user_high] = pair(userId, otherId);
  const conversation = await getDb().conversation.upsert({ where: { user_low_user_high: { user_low, user_high } }, create: { user_low, user_high }, update: {}, select: { id: true } });
  return conversation.id;
}

export const conversationFor = (id, userId) => getDb().conversation.findFirst({ where: { id, OR: [{ user_low: userId }, { user_high: userId }] } });

const involving = (userId) => ({ OR: [{ user_low: userId }, { user_high: userId }] });

export async function listConversations(userId) {
  const db = getDb();
  const rows = await db.conversation.findMany({
    where: { ...involving(userId), last_message_at: { not: null } },
    include: {
      low: { select: { id: true, name: true, role: true } },
      high: { select: { id: true, name: true, role: true } },
      messages: { select: { body: true }, orderBy: { id: 'desc' }, take: 1 },
    },
    orderBy: { last_message_at: 'desc' },
  });
  const unread = await db.message.groupBy({
    by: ['conversation_id'],
    where: { conversation_id: { in: rows.map((row) => row.id) }, sender_id: { not: userId }, read_at: null },
    _count: { id: true },
  });
  const unreadBy = new Map(unread.map((row) => [row.conversation_id, row._count.id]));
  return rows.map((row) => {
    const other = row.user_low === userId ? row.high : row.low;
    return { id: row.id, last_message_at: row.last_message_at, other_id: other.id, other_name: other.name, other_role: other.role, preview: row.messages[0]?.body ?? '', unread: unreadBy.get(row.id) ?? 0 };
  });
}

export const unreadCount = (userId) => getDb().message.count({ where: { sender_id: { not: userId }, read_at: null, conversation: involving(userId) } });

const MESSAGE_SELECT = { id: true, sender_id: true, body: true, created_at: true, read_at: true };

export async function fetchMessages(conversationId, userId, afterId = 0) {
  const db = getDb();
  await db.message.updateMany({ where: { conversation_id: conversationId, sender_id: { not: userId }, read_at: null }, data: { read_at: new Date() } });
  return db.message.findMany({ where: { conversation_id: conversationId, id: { gt: afterId } }, select: MESSAGE_SELECT, orderBy: { id: 'asc' }, take: 200 });
}

export async function postMessage(conversationId, senderId, body) {
  const db = getDb();
  const [message] = await db.$transaction([
    db.message.create({ data: { conversation_id: conversationId, sender_id: senderId, body }, select: MESSAGE_SELECT }),
    db.conversation.update({ where: { id: conversationId }, data: { last_message_at: new Date() } }),
  ]);
  return message;
}

export async function setBlocked(userId, otherId, blocked) {
  const db = getDb();
  if (blocked) await db.userBlock.createMany({ data: [{ blocker_id: userId, blocked_id: otherId }], skipDuplicates: true });
  else await db.userBlock.deleteMany({ where: { blocker_id: userId, blocked_id: otherId } });
}

export const isBlockedBy = async (blockerId, blockedId) => !!(await getDb().userBlock.findUnique({ where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blockedId } } }));

// Every check a new message passes, then the message and the recipient's notification.
export async function sendMessageAs(user, conversationId, otherId, body) {
  const reason = await chatBlockReason(user, otherId);
  if (reason) return { ok: false, status: 403, message: reason, upgrade: reason === INBOX_LOCKED };
  if (!(await rateLimit(`chat:${user.id}`, 30, 60))) return { ok: false, status: 429, message: 'You are sending messages too quickly.' };
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) return { ok: false, status: 400, message: 'Write a message first.' };
  if (text.length > MAX_MESSAGE) return { ok: false, status: 400, message: `Messages can be up to ${MAX_MESSAGE} characters.` };
  const message = await postMessage(conversationId, user.id, text);
  await notify(otherId, { type: 'message', title: `New message from ${user.name}`, body: text.slice(0, 140), href: `/messages/${conversationId}`, groupKey: `conversation:${conversationId}` });
  return { ok: true, message };
}
