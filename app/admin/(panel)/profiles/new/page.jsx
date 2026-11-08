import Link from 'next/link';
import { ProfileCreator } from '@/components/admin/ProfileCreator';
import { Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';
import { activeCountries, casteOptions } from '@/lib/places.js';

export default async function NewProfile() {
  const t = await getT();
  await requireAdmin();
  return (
    <div className="max-w-[980px]">
      <Link href="/admin/profiles" className="text-xs text-navy">{t('← Profiles')}</Link>
      <div className="mt-3"><Title text="Paste a biodata to fill everything in at once, or enter the details yourself.">{t('Add New Profile')}</Title></div>
      <ProfileCreator countries={await activeCountries()} castes={await casteOptions()} />
    </div>
  );
}
