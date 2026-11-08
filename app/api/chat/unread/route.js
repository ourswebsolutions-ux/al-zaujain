import { currentUser } from '@/lib/auth.js';
import { jsonError } from '@/lib/api.js';
import { unreadCount } from '@/lib/chat.js';
import { unreadNotifications } from '@/lib/notifications.js';

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError('Please sign in.', 401);
  const [unread, notifications] = await Promise.all([unreadCount(user.id), unreadNotifications(user.id)]);
  return Response.json({ unread, notifications });
}
