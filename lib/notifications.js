import { getDb } from './db.js';

// Grouped notifications update one unread row, so a long chat does not flood the list.
export async function notify(userId, { type, title, body = null, href = null, groupKey = null }) {
  if (!userId) return;
  const db = getDb();
  if (groupKey) {
    const existing = await db.notification.findFirst({ where: { user_id: userId, group_key: groupKey, read_at: null }, select: { id: true } });
    if (existing) {
      await db.notification.update({ where: { id: existing.id }, data: { title, body, href, created_at: new Date() } });
      return;
    }
  }
  await db.notification.create({ data: { user_id: userId, type, title, body, href, group_key: groupKey } });
}

export const listNotifications = (userId, take = 50) => getDb().notification.findMany({ where: { user_id: userId }, orderBy: { id: 'desc' }, take });

export const unreadNotifications = (userId) => getDb().notification.count({ where: { user_id: userId, read_at: null } });

export const markAllRead = (userId) => getDb().notification.updateMany({ where: { user_id: userId, read_at: null }, data: { read_at: new Date() } });

export const markRead = (userId, id) => getDb().notification.updateMany({ where: { id, user_id: userId, read_at: null }, data: { read_at: new Date() } });
