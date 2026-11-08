import { SmtpForm, SmtpTest } from '@/components/admin/SettingsForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getSettings } from '@/lib/settings.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Smtp() {
  const t = await getT();
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="max-w-[760px]">
      <Title>{t('Email server')}</Title>
      <p className="mb-4 text-xs leading-5 text-muted">{t('These values take priority over the SMTP_ environment variables. The password is stored encrypted.')}</p>
      <Panel><SmtpForm values={settings} hasPassword={!!settings.smtp_pass_enc} /></Panel>
      <Panel title={t('Test')}><SmtpTest /></Panel>
    </div>
  );
}
