import { getTheme } from '@/lib/theme-server.js';
import { StaffFooter } from '@/components/layout/StaffFooter';
import { StaffShell } from '@/components/layout/StaffShell';
import { requireConsultant } from '@/lib/auth.js';
import { unreadCount } from '@/lib/chat.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Consultant dashboard', robots: { index: false, follow: false } };

export default async function ConsultantLayout({ children }) {
  const t = await getT();
  const { user, consultant } = await requireConsultant();
  const items = [
    { href: '/consultant', label: 'Overview' },
    { href: '/consultant/profiles', label: 'Assigned profiles' },
    { href: '/consultant/proposals', label: 'Matching proposals' },
    { href: '/messages', label: 'Messages', badge: await unreadCount(user.id) },
    { href: '/consultant/account', label: 'My profile' },
  ];
  return <StaffShell theme={await getTheme()} title={t('Consultant dashboard')} items={items} footer={<StaffFooter name={consultant.display_name} />}>{children}</StaffShell>;
}
