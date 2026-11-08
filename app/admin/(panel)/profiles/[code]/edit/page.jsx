import { notFound } from 'next/navigation';
import { Title } from '@/components/admin/Ui';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { requireAdmin } from '@/lib/auth.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { profileFormValues } from '@/lib/profile-schema.js';
import { getProfile, profilePhotos } from '@/lib/profiles.js';

export default async function EditProfile({ params }) {
  await requireAdmin();
  const profile = await getProfile(idFromCode((await params).code));
  if (!profile) notFound();
  const code = profileCode(profile.id);
  return (
    <div className="max-w-[980px]">
      <Title>Edit {code}</Title>
      <ProfileWizard mode="edit" code={code} countries={await activeCountries()} castes={await casteOptions()} initial={profileFormValues(profile)} existingPhotos={await profilePhotos(profile.id)} photoPublic={profile.photo_public} verificationStatus={profile.verification_status} doneUrl={`/admin/profiles/${code}`} admin={{ type: profile.access_type, extra: profile.extra_info ?? '' }} />
    </div>
  );
}
