import { RestrictionsForm } from '@/components/admin/PaymentForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';
import { RESTRICTIONS, restrictionsFrom } from '@/lib/restrictions.js';
import { getSettings } from '@/lib/settings.js';

export default async function Restrictions() {
  await requireAdmin();
  const t = await getT();
  const settings = await getSettings();
  return (
    <div className="max-w-[760px]">
      <Title text="Choose exactly what needs payment. Each switch works on its own, and changes apply straight away.">{t('Restrictions')}</Title>
      <Panel><RestrictionsForm items={RESTRICTIONS.map(({ key, label, text }) => ({ key, label, text }))} values={restrictionsFrom(settings)} price={settings.access_price ?? ''} days={settings.access_days ?? '365'} /></Panel>
      <p className="text-xs leading-5 text-muted">{t('Addresses and dates of birth are never shown to members. A photo the member chose to keep private stays private.')}</p>
    </div>
  );
}
