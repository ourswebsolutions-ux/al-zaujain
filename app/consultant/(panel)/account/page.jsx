import { Panel, Title } from '@/components/admin/Ui';
import { ConsultantAccountForm } from '@/components/forms/ConsultantAccountForm';
import { requireConsultant } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Account() {
  const t = await getT();
  const { consultant } = await requireConsultant();
  return <div className="max-w-[640px]"><Title>{t('My profile')}</Title><Panel><ConsultantAccountForm consultant={consultant} /></Panel></div>;
}
