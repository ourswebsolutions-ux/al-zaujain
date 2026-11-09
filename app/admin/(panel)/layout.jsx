import { StaffFooter } from '@/components/layout/StaffFooter';
import { StaffShell } from '@/components/layout/StaffShell';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getTheme } from '@/lib/theme-server.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const t = await getT();
  const admin = await requireAdmin();
  const db = getDb();
  const items = [
    { href: '/admin', label: 'Dashboard' },
    { group: 'Proposals' },
    { href: '/admin/profiles', label: 'Profiles', badge: await db.profile.count({ where: { status: 'pending' } }) },
    { href: '/admin/verification', label: 'Blue tick requests', badge: await db.profile.count({ where: { verification_status: 'pending' } }) },
    { href: '/admin/featured', label: 'Homepage proposals' },
    { group: 'People' },
    { href: '/admin/users', label: 'User management' },
    { href: '/admin/consultants', label: 'Consultants' },
    { href: '/admin/chat', label: 'Chat and messages' },
    { href: '/admin/enquiries', label: 'Enquiries', badge: await db.enquiry.count({ where: { handled: false } }) },
    { group: 'Payments' },
    { href: '/admin/payment-requests', label: 'Payment Requests', badge: await db.paymentRequest.count({ where: { status: 'pending' } }) },
    { href: '/admin/payment-methods', label: 'Payment Methods' },
    { href: '/admin/restrictions', label: 'Restrictions' },
    { href: '/admin/paid-users', label: 'Paid Users' },
    { href: '/admin/payment-history', label: 'Payment History' },
    { group: 'Premium credits' },
    { href: '/admin/packages', label: 'Premium Profile Packages' },
    { href: '/admin/credits', label: 'Credits and unlocks' },
    { href: '/admin/fees', label: 'Consultancy fees' },
    { group: 'Website' },
    { href: '/admin/content', label: 'Website content' },
    { href: '/admin/faqs', label: 'FAQs' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/locations', label: 'Countries and cities' },
    { href: '/admin/castes', label: 'Castes / Biradari' },
    { group: 'Settings' },
    { href: '/admin/matching', label: 'Matching rules' },
    { href: '/admin/emails', label: 'Email messages' },
    { href: '/admin/smtp', label: 'Email server' },
    { href: '/admin/activity', label: 'Activity log' },
  ];
  return <StaffShell theme={await getTheme()} title={t('Admin dashboard')} items={items} footer={<StaffFooter name={admin.name} />}>{children}</StaffShell>;
}
