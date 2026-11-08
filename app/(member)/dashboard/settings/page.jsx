import { AccountForms } from '@/components/forms/AccountForms';
import { PageHeader } from '@/components/member/Ui';
import { requireUser } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function SettingsPage() {
  const t = await getT();
  const user = await requireUser('/dashboard/settings');
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title={t('Account settings')} text={t('Your details, notification preferences, privacy and password.')} />
      <AccountForms user={user} />
    </div>
  );
}
