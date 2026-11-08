import Link from 'next/link';
import { Panel, Title } from '@/components/admin/Ui';
import { NewUserForm } from '@/components/admin/UserForms';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function NewUser() {
  await requireAdmin();
  const t = await getT();
  return (
    <div className="max-w-[760px]">
      <Link href="/admin/users" className="text-[13px] text-navy">← {t('User management')}</Link>
      <div className="mt-3"><Title text="Create a member or consultant account.">{t('Add user')}</Title></div>
      <Panel><NewUserForm /></Panel>
    </div>
  );
}
