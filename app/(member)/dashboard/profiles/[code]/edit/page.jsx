import { notFound } from 'next/navigation';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { PageHeader } from '@/components/member/Ui';
import { requireUser } from '@/lib/auth.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { profileFormValues } from '@/lib/profile-schema.js';
import { getProfile, profilePhotos } from '@/lib/profiles.js';
import { getT } from '@/lib/i18n/server.js';

export default async function EditOwnProfilePage({ params }) {
  const t = await getT();
  const user = await requireUser();
  const { code } = await params;
  const profile = await getProfile(idFromCode(code));
  if (!profile || profile.user_id !== user.id) notFound();
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader title={t('Edit profile {code}', { code: profileCode(profile.id) })} text={t('Editing a live profile sends it back to our team for review.')} />
      <ProfileWizard mode="edit" code={profileCode(profile.id)} countries={await activeCountries()} castes={await casteOptions()} initial={profileFormValues(profile)} existingPhotos={await profilePhotos(profile.id)} photoPublic={profile.photo_public} verificationStatus={profile.verification_status} doneUrl={`/dashboard/profiles/${profileCode(profile.id)}`} />
    </div>
  );
}
