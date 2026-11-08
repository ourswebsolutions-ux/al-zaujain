import Link from 'next/link';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { PageHeading } from '@/components/listing/PageHeading';
import { currentUser } from '@/lib/auth.js';
import { activeCountries, casteOptions } from '@/lib/places.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Submit a matrimonial profile', description: 'Submit a matrimonial profile to Al Zaujain. No account is needed.' };

export default async function SubmitProfilePage() {
  const t = await getT();
  const user = await currentUser();
  return (
    <main>
      <PageHeading tag="BISMILLAH. LET’S BEGIN." title={t('Submit a profile')} urdu="اپنا رشتہ جمع کرائیں" text={t('No account needed. Fields marked with a lock are never shown publicly.')} />
      <div className="mx-auto max-w-[900px] px-[5%] py-12">
        {!user && <p className="mb-6 text-sm">{t('Already registered?')} <Link href="/login?next=/submit-profile" className="font-semibold text-navy underline">{t('Sign in')}</Link> {t('so this profile is added to your account.')}</p>}
        <ProfileWizard countries={await activeCountries()} castes={await casteOptions()} initial={user ? { contact_email: user.email, contact_phone: user.phone ?? '' } : {}} />
      </div>
    </main>
  );
}
