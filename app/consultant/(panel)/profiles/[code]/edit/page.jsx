import { notFound, redirect } from 'next/navigation';
import { Title } from '@/components/admin/Ui';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { requireConsultant } from '@/lib/auth.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { profileFormValues } from '@/lib/profile-schema.js';
import { getProfile, profilePhotos } from '@/lib/profiles.js';

export default async function ConsultantEdit({ params }) {
  const { consultant } = await requireConsultant();
  const profile = await getProfile(idFromCode((await params).code));
  if (!profile || profile.consultant_id !== consultant.id) notFound();
  const code = profileCode(profile.id);
  if (!consultant.perm_edit) redirect(`/consultant/profiles/${code}`);
  return (
    <div className="max-w-[900px]">
      <Title>Edit {code}</Title>
      <ProfileWizard mode="edit" code={code} countries={await activeCountries()} castes={await casteOptions()} initial={profileFormValues(profile)} existingPhotos={await profilePhotos(profile.id)} photoPublic={profile.photo_public} verificationStatus={profile.verification_status} doneUrl={`/consultant/profiles/${code}`} />
    </div>
  );
}
