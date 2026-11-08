import { LegalPage } from '@/components/listing/LegalPage';
import { getT } from '@/lib/i18n/server.js';
import { PRIVACY } from '@/lib/legal.js';

export const metadata = { title: 'Privacy policy' };


export default async function PrivacyPage() {
  const t = await getT();
  return <LegalPage title={t('Privacy policy')} sections={PRIVACY} />;
}
