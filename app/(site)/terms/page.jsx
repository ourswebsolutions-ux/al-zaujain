import { LegalPage } from '@/components/listing/LegalPage';
import { getT } from '@/lib/i18n/server.js';
import { TERMS } from '@/lib/legal.js';

export const metadata = { title: 'Terms of use' };


export default async function TermsPage() {
  const t = await getT();
  return <LegalPage title={t('Terms of use')} sections={TERMS} />;
}
