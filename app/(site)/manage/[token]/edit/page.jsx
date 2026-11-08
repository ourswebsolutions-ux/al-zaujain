import { notFound } from 'next/navigation';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { profileCode } from '@/lib/format.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { profileFormValues } from '@/lib/profile-schema.js';
import { profileByManageToken, profilePhotos } from '@/lib/profiles.js';
import { sha256 } from '@/lib/security.js';

export const metadata = { title: 'Edit your profile', robots: { index: false, follow: false } };

export default async function ManageEditPage({ params }) {
  const { token } = await params;
  const profile = await profileByManageToken(sha256(token));
  if (!profile) notFound();
  return (
    <main className="mx-auto max-w-[900px] px-[5%] py-12">
      <h1 className="mb-6 font-quicksand text-3xl font-bold">Edit profile {profileCode(profile.id)}</h1>
      <ProfileWizard mode="edit" code={profileCode(profile.id)} token={token} countries={await activeCountries()} castes={await casteOptions()} initial={profileFormValues(profile)} existingPhotos={await profilePhotos(profile.id)} photoPublic={profile.photo_public} verificationStatus={profile.verification_status} doneUrl={`/manage/${token}`} />
    </main>
  );
}
