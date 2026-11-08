import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaPlus } from 'react-icons/fa6';
import { PageHeader } from '@/components/member/Ui';
import { BiodataHeader, CandidateSection, PartnerSection } from '@/components/profile/Biodata';
import { ManagePanel } from '@/components/profile/ManagePanel';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { memberProfiles } from '@/lib/dashboard.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { manageProps } from '@/lib/manage-view.js';
import { biodata } from '@/lib/profile-schema.js';
import { getT } from '@/lib/i18n/server.js';

export default async function ManageOwnProfilePage({ params }) {
  const t = await getT();
  const user = await requireUser();
  const { code } = await params;
  const profiles = await memberProfiles(user.id);
  const profile = profiles.find((item) => item.id === idFromCode(code));
  if (!profile) notFound();
  const label = profileCode(profile.id);
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t('My matrimonial profile')}
        text={t('This is your full biodata. Your private details appear only here and in your own downloads.')}
        action={<ButtonLink tone="outline" size="sm" href="/dashboard/edit?new=1"><FaPlus aria-hidden="true" /> {t('Add another profile')}</ButtonLink>}
      />
      {profiles.length > 1 && (
        <nav aria-label={t('Your profiles')} className="-mt-3 flex flex-wrap gap-2">
          {profiles.map((item) => (
            <Link key={item.id} href={`/dashboard/profiles/${profileCode(item.id)}`} aria-current={item.id === profile.id ? 'page' : undefined} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold no-underline ${item.id === profile.id ? 'border-navy bg-navy text-white' : 'border-[var(--d-line,#e7e9ee)] bg-white text-navy hover:border-gold'}`}>
              {item.display_name} · {profileCode(item.id)}
            </Link>
          ))}
        </nav>
      )}
      <ManagePanel profile={profile} actions={await manageProps(profile)} editHref={`/dashboard/profiles/${label}/edit`} />
      <article className="overflow-hidden rounded-[20px] border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_10px_28px_#03223f08]">
        <BiodataHeader data={biodata(profile, label, { publicOnly: false })} />
        <div className="p-8 max-m:p-5"><CandidateSection data={biodata(profile, label, { publicOnly: false })} /></div>
        <PartnerSection data={biodata(profile, label, { publicOnly: false })} />
      </article>
    </div>
  );
}
