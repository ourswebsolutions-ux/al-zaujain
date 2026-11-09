'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaLocationDot } from 'react-icons/fa6';
import { SaveButton } from './SaveButton';
import { PhotoLock } from '@/components/payments/UnlockProvider';
import { useT } from '@/components/i18n/LanguageProvider';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { TypeBadge } from './TypeBadge';

function Cover({ profile, tag, saved }) {
  const t = useT();
  return (
    <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-[var(--d-hover,#e9e1d1)] even:bg-[#e3eaf0]">
      {profile.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/media/photos/${profile.photo}`} alt={t('Portrait of {name}', { name: profile.name })} loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <Image src="/images/logo.png" alt="" width={120} height={120} className="rounded-full opacity-60" />
      )}
      {profile.photo && <PhotoLock type={profile.type} />}
      {tag && <span className="absolute start-3 top-3 z-10 rounded-[20px] bg-[#fcfbf8ed] px-3 py-[7px] font-sans text-[10px] font-bold leading-[15px] tracking-[.6px] text-navy">{tag}</span>}
      {saved !== undefined && <SaveButton code={profile.code} saved={saved} />}
      <TypeBadge type={profile.type} className="absolute bottom-3 start-3 z-10" />
      <span className="absolute bottom-3 end-3 z-10 rounded-md bg-[#062b4ed9] px-2.5 py-1.5 font-sans text-[10px] font-bold leading-[15px] tracking-[.6px] text-white">{profile.code}</span>
    </div>
  );
}

function Meta({ label, value }) {
  const t = useT();
  return (
    <div className="my-[13px] flex flex-col gap-[3px]">
      <dt className="text-[11px] font-semibold uppercase leading-[16.5px] tracking-[.7px] text-muted">{t(label)}</dt>
      <dd className="truncate text-sm font-semibold leading-[21px]">{t(value) || '—'}</dd>
    </div>
  );
}

// Shared by the homepage, listings and match sections. Only ever receives public fields.
export function ProposalCard({ profile, tag, matchScore, saved }) {
  const t = useT();
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white p-2.5 font-nunito text-navy shadow-[0_6px_22px_#03223f08] transition-[box-shadow,border-color] duration-[250ms] focus-within:border-gold focus-within:shadow-[0_16px_35px_#03223f18] hover:border-gold hover:shadow-[0_16px_35px_#03223f18]">
      <Cover profile={profile} tag={tag ? t(tag) : matchScore ? t('{score}% match', { score: matchScore }) : undefined} saved={saved} />
      <div className="px-3 pb-3 pt-[23px]">
        <h3 className="mb-2 text-[23px] font-extrabold leading-[27.6px]">
          {profile.name} <span className="text-[19px] font-semibold leading-[22.8px] text-muted">· {profile.age}</span>
          {profile.verified && <VerifiedBadge className="ms-1.5 text-lg" />}
        </h3>
        <p className="mb-4 truncate text-[13px] leading-[23.4px] text-muted">
          <FaLocationDot aria-hidden="true" className="me-[5px] inline-block align-[-1px] text-[var(--d-gold,#b18433)]" />
          {[t(profile.city), t(profile.country)].filter(Boolean).join(', ')}
        </p>
        <dl className="my-5 border-t border-[var(--d-line,#eee6d8)] pt-[5px]">
          <Meta label="Education" value={profile.education} />
          <Meta label="Profession" value={profile.profession} />
          <Meta label="Marital status" value={profile.maritalStatus} />
        </dl>
        <Link href={`/profile/${profile.code}`} className="group flex items-center justify-between gap-2 rounded-xl bg-cream p-[15px] text-[13px] font-bold leading-[19.5px] text-navy no-underline transition-colors hover:bg-navy hover:text-white">
          {t('View proposal')}
          <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100 transition-transform duration-200 group-hover:translate-x-[3px] rtl:group-hover:-translate-x-[3px]" />
        </Link>
      </div>
    </article>
  );
}
