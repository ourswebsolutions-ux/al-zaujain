import { Panel, Stat, Title } from '@/components/admin/Ui';
import { MatchingForm, RunMatching } from '@/components/admin/SettingsForms';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getWeights } from '@/lib/matching.js';
import { getSettings } from '@/lib/settings.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Matching() {
  const t = await getT();
  await requireAdmin();
  const n = await getDb().matchNotification.count();
  return (
    <div className="max-w-[760px]">
      <Title>{t('Matching rules')}</Title>
      <Panel><MatchingForm settings={await getSettings()} weights={await getWeights()} /></Panel>
      <Panel title={t('Automatic emails')}>
        <p className="mb-3 text-xs leading-5 text-muted">{t('The site checks hourly. Each member receives emails on their chosen daily or weekly schedule, and never the same proposal twice.')}</p>
        <div className="mb-4 w-52"><Stat label={t('Matches emailed')} value={n} /></div>
        <RunMatching />
      </Panel>
    </div>
  );
}
