import { FaBell } from 'react-icons/fa6';
import { readAllNotifications } from '@/app/actions/member';
import { NotificationList } from '@/components/member/NotificationList';
import { Card, EmptyState, PageHeader } from '@/components/member/Ui';
import { Button } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { listNotifications } from '@/lib/notifications.js';
import { getT } from '@/lib/i18n/server.js';

export default async function NotificationsPage() {
  const t = await getT();
  const user = await requireUser('/dashboard/notifications');
  const items = await listNotifications(user.id);
  const unread = items.some((item) => !item.read_at);
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title={t('Notifications')} text={t('Updates about your profile, matches, messages and verification.')} action={unread && <form action={readAllNotifications}><Button type="submit" tone="outline" size="sm" className="cursor-pointer">{t('Mark all as read')}</Button></form>} />
      {items.length > 0 ? <Card><NotificationList items={items} /></Card> : <EmptyState icon={<FaBell aria-hidden="true" />} title={t('You’re all caught up')} text={t('New updates will appear here.')} />}
    </div>
  );
}
