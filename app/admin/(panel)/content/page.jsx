import { ContentForm } from '@/components/admin/SettingsForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { CONTENT_FIELDS } from '@/lib/content-fields.js';
import { getSettings } from '@/lib/settings.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Content() {
  const t = await getT();
  await requireAdmin();
  return <div className="max-w-[760px]"><Title>{t('Website content')}</Title><Panel><ContentForm fields={CONTENT_FIELDS} settings={await getSettings()} /></Panel></div>;
}
