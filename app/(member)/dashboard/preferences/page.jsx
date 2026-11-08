import { FaSliders } from 'react-icons/fa6';
import { PreferencesForm } from '@/components/forms/PreferencesForm';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { memberProfiles, primaryProfile } from '@/lib/dashboard.js';
import { profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { profileFormValues } from '@/lib/profile-schema.js';
import { getT } from '@/lib/i18n/server.js';

export default async function PreferencesPage() {
  const t = await getT();
  const user = await requireUser('/dashboard/preferences');
  const profile = primaryProfile(await memberProfiles(user.id));
  const header = <PageHeader title={t('Partner preferences')} text={t('Describe who you are looking for. This is shown in its own section on your biodata and drives your recommended matches.')} />;
  if (!profile) return <>{header}<EmptyState icon={<FaSliders aria-hidden="true" />} title={t('Create your biodata first')} text={t('Your partner requirements are part of your matrimonial profile.')} action={<ButtonLink tone="gold" href="/dashboard/edit">{t('Create my biodata')}</ButtonLink>} /></>;
  return (
    <div className="mx-auto max-w-[900px]">
      {header}
      <PreferencesForm code={profileCode(profile.id)} initial={profileFormValues(profile)} countries={await activeCountries()} castes={await casteOptions()} />
    </div>
  );
}
