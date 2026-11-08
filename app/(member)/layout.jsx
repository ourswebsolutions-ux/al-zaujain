import { MemberShell } from '@/components/member/MemberShell';
import { getTheme } from '@/lib/theme-server.js';
import { requireUser } from '@/lib/auth.js';
import { unreadCount } from '@/lib/chat.js';
import { getDb } from '@/lib/db.js';
import { listNotifications, unreadNotifications } from '@/lib/notifications.js';

export const metadata = { title: 'My account', robots: { index: false, follow: false } };

export default async function MemberLayout({ children }) {
  const user = await requireUser();
  const [unreadMessages, unreadAlerts, recent, photo] = await Promise.all([
    unreadCount(user.id),
    unreadNotifications(user.id),
    listNotifications(user.id, 5),
    getDb().profilePhoto.findFirst({ where: { profile: { user_id: user.id } }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], select: { thumb: true } }),
  ]);
  return <MemberShell theme={await getTheme()} user={user} avatar={photo?.thumb} unreadMessages={unreadMessages} unreadAlerts={unreadAlerts} recent={recent}>{children}</MemberShell>;
}
