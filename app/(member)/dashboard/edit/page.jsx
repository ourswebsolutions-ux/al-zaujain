import { redirect } from 'next/navigation';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { PageHeader } from '@/components/member/Ui';
import { requireUser } from '@/lib/auth.js';
import { memberProfiles, primaryProfile } from '@/lib/dashboard.js';
import { profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { getT } from '@/lib/i18n/server.js';

export default async function EditEntryPage({ searchParams }) {
  const t = await getT();
  const user = await requireUser('/dashboard/edit');
  const { new: addNew } = await searchParams;
  const primary = primaryProfile(await memberProfiles(user.id));
  if (primary && !addNew) redirect(`/dashboard/profiles/${profileCode(primary.id)}/edit`);
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader title={t('Create your biodata')} text={t('Fields marked with a lock are never shown publicly.')} />
      <ProfileWizard countries={await activeCountries()} castes={await casteOptions()} initial={{ contact_email: user.email, contact_phone: user.phone ?? '' }} doneUrl="/dashboard/profile" />
    </div>
  );
}
