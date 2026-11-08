import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaCircleCheck } from 'react-icons/fa6';
import { claimProfile } from '@/app/actions/auth';
import { ManagePanel } from '@/components/profile/ManagePanel';
import { Button, ButtonLink } from '@/components/ui/Button';
import { currentUser } from '@/lib/auth.js';
import { manageProps } from '@/lib/manage-view.js';
import { profileByManageToken } from '@/lib/profiles.js';
import { sha256 } from '@/lib/security.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Your profile', robots: { index: false, follow: false } };

export default async function ManagePage({ params }) {
  const t = await getT();
  const { token } = await params;
  const profile = await profileByManageToken(sha256(token));
  if (!profile) notFound();
  const user = await currentUser();
  const actions = await manageProps(profile, token);

  return (
    <main className="mx-auto max-w-[900px] px-[5%] py-12">
      <div className="mb-7 flex items-start gap-3 rounded-2xl bg-cream p-6">
        <FaCircleCheck aria-hidden="true" className="mt-1 text-xl text-[#3d6b4a]" />
        <div>
          <h1 className="font-quicksand text-2xl font-bold">Your profile {actions.code}</h1>
          <p className="mt-1 text-sm leading-6 text-muted">{t('Keep this page’s link private: it is how you view, edit and download this profile. We have also emailed it to you.')}</p>
        </div>
      </div>
      <ManagePanel profile={profile} actions={actions} editHref={`/manage/${token}/edit`} token={token}>
        {!profile.user_id && (
          <section className="rounded-[20px] border border-[#ddcfb1] bg-[#f8f4eb] p-6">
            <h2 className="font-quicksand text-lg font-bold">{t('Manage this profile from an account')}</h2>
            {user ? (
              <form action={claimProfile} className="mt-3">
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="cursor-pointer">{t('Add to my account')}</Button>
              </form>
            ) : (
              <>
                <p className="mb-3 mt-1 text-sm text-muted">{t('Create an account from here and this profile is added to it automatically.')}</p>
                <div className="flex gap-3">
                  <ButtonLink href={`/register?claim=${token}`}>{t('Create account')}</ButtonLink>
                  <ButtonLink tone="outline" href={`/login?next=/manage/${token}`}>{t('Sign in')}</ButtonLink>
                </div>
              </>
            )}
          </section>
        )}
      </ManagePanel>
      <p className="mt-8 text-sm"><Link href="/proposals" className="font-semibold text-navy">{t('Browse proposals →')}</Link></p>
    </main>
  );
}
