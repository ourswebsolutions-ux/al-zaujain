import { createConsultant } from '@/app/actions/admin';
import { ConsultantForm } from '@/components/admin/ConsultantForm';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { citiesWithCountry } from '@/lib/places.js';
import { getT } from '@/lib/i18n/server.js';

export default async function NewConsultant() {
  const t = await getT();
  await requireAdmin();
  return <div className="max-w-[760px]"><Title>{t('Add consultant')}</Title><Panel><ConsultantForm action={createConsultant} cities={(await citiesWithCountry()).map((city) => city.name)} /></Panel></div>;
}
