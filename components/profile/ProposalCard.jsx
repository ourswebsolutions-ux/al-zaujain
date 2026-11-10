'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaBriefcase, FaCakeCandles, FaCrown, FaGraduationCap, FaLocationDot, FaLock, FaLockOpen, FaRing } from 'react-icons/fa6';
import { SaveButton } from './SaveButton';
import { PhotoLock, useUnlock } from '@/components/payments/UnlockProvider';
import { useT } from '@/components/i18n/LanguageProvider';
import { CardPhoto } from '@/components/profile/CardPhoto';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// The corner ribbon from the reference design: Free, Premium (unlocks with credits) or Exclusive.
const RIBBONS = {
  public: { label: 'Free', className: 'bg-[#1f8a3a] text-white', fold: 'border-t-[#145c27]' },
  paid: { label: 'Premium', className: 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark', fold: 'border-t-[#8c6420]' },
  premium: { label: 'Exclusive', className: 'bg-navy text-champagne', fold: 'border-t-dark' },
};

function Ribbon({ type }) {
  const t = useT();
  const ribbon = RIBBONS[type] ?? RIBBONS.paid;
  return (
    <span className="absolute -end-1.5 top-4 z-10 max-sm:end-auto max-sm:start-[22px] max-sm:top-[22px]">
      <span className={`block py-1 pe-3 ps-4 text-[10.5px] font-extrabold uppercase tracking-[.6px] shadow-[0_3px_8px_#03223f2e] [clip-path:polygon(9px_0,100%_0,100%_100%,9px_100%,0_50%)] rtl:[clip-path:polygon(0_0,calc(100%-9px)_0,100%_50%,calc(100%-9px)_100%,0_100%)] max-sm:rounded-full max-sm:px-3 max-sm:py-[7px] max-sm:text-[10px] max-sm:[clip-path:none] max-sm:rtl:[clip-path:none] ${ribbon.className}`}>{t(ribbon.label)}</span>
      <span aria-hidden="true" className={`absolute end-0 top-full block size-0 border-e-[6px] border-t-[6px] border-e-transparent max-sm:hidden ${ribbon.fold} rtl:border-e-0 rtl:border-s-[6px] rtl:border-s-transparent`} />
    </span>
  );
}

function Row({ icon: Icon, children }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-[13.5px] leading-[22px] text-[#47566a]">
      <Icon aria-hidden="true" className="w-3.5 shrink-0 text-[#a9b2bd]" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}

/**
 * The candidate card used on the homepage, in listings and in match sections, following the
 * supplied profile-ui reference: an oval portrait with a round status button over its edge, a corner
 * ribbon, the name, three or four facts with icons, and a "Profile Detail" style button.
 * On phones it lies sideways like the reference; on wider screens it stands upright with a larger portrait.
 * It only ever receives public card fields.
 */
export function ProposalCard({ profile, tag, matchScore, saved }) {
  const t = useT();
  const { unlockCost, isUnlocked, photoLocked } = useUnlock();
  const type = profile.type ?? 'paid';
  const unlocked = type === 'paid' && isUnlocked(profile.code);
  const locked = type === 'paid' && !unlocked;
  const href = `/profile/${profile.code}`;
  const label = tag ?? (matchScore ? t('{score}% match', { score: matchScore }) : null);
  const status = type === 'premium'
    ? { icon: FaCrown, className: 'bg-navy text-champagne', title: 'Exclusive proposal, introduced by our consultants' }
    : locked
      ? { icon: FaLock, className: 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark', title: 'Premium profile: unlock with credits' }
      : { icon: FaLockOpen, className: 'bg-[#1f8a3a] text-white', title: unlocked ? 'Unlocked for you' : 'Free profile' };

  return (
    <article className="group relative h-full rounded-[22px] border border-[#e9e2d4] bg-[linear-gradient(180deg,#ffffff,#fbf8f1)] p-4 font-nunito text-navy shadow-[0_10px_26px_#03223f12] transition-[box-shadow,border-color,transform] duration-[250ms] focus-within:border-gold hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_18px_40px_#03223f1f] max-sm:rounded-[24px] max-sm:border-[#ddd1b8] max-sm:bg-white max-sm:bg-none max-sm:p-2.5 max-sm:shadow-[0_6px_22px_#03223f08] sm:flex sm:flex-col sm:p-5">
      <Ribbon type={type} />
      <div className="flex gap-4 max-sm:flex-col max-sm:gap-0 sm:flex-col sm:items-center sm:gap-4">
        <Link href={href} aria-label={t('View proposal {code}', { code: profile.code })} className="relative block shrink-0 self-start no-underline max-sm:w-full sm:self-center">
          <span className="relative block h-[150px] w-[118px] overflow-hidden rounded-[50%] border-[3px] border-[#b18433] bg-white p-[3px] shadow-[0_8px_20px_#03223f26] max-sm:aspect-square max-sm:h-auto max-sm:w-full max-sm:rounded-2xl max-sm:border-0 max-sm:p-0 max-sm:shadow-none sm:h-[220px] sm:w-[172px]">
            <span className="relative block size-full overflow-hidden rounded-[50%] bg-[#e9e1d1] max-sm:rounded-2xl">
              {profile.photo ? (
<CardPhoto profile={profile} alt={t('Portrait of {name}', { name: profile.name })} />
              ) : (
                <span className="absolute inset-0 grid place-items-center"><Image src="/images/logo.png" alt="" width={84} height={84} className="rounded-full opacity-60" /></span>
              )}
              {profile.photo && photoLocked && <PhotoLock type={type} code={profile.code} className="absolute inset-0 rounded-[50%] max-sm:rounded-2xl" />}
            </span>
            <span aria-hidden="true" className="absolute bottom-3 end-3 z-[6] rounded-md bg-[#062b4ed9] px-2.5 py-1.5 font-sans text-[10px] font-bold tracking-[.6px] text-white sm:hidden">{profile.code}</span>
          </span>
          <span title={t(status.title)} className={`absolute bottom-2 start-0 z-10 grid size-10 place-items-center rounded-full border-[3px] border-white text-[15px] shadow-[0_4px_12px_#03223f40] max-sm:bottom-3 max-sm:start-3 max-sm:size-9 max-sm:text-[13px] sm:bottom-3 sm:start-1 sm:size-11 ${status.className}`}>
            <status.icon aria-hidden="true" />
            <span className="sr-only">{t(status.title)}</span>
          </span>
        </Link>

        <div className="min-w-0 flex-1 pt-1 max-sm:px-3 max-sm:pt-[23px] sm:w-full sm:pt-0">
          {label && <span className="mb-1.5 inline-block rounded-full bg-[#fcf4e1] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-[#806126]">{label}</span>}
          <h3 className="flex min-w-0 items-center gap-1.5 pe-12 text-[21px] font-extrabold leading-tight text-[#062b4e] max-sm:pe-0 max-sm:text-[23px] sm:pe-0">
            <Link href={href} className="min-w-0 truncate text-inherit no-underline">{profile.name}</Link>
            {profile.age && <span className="shrink-0 text-[19px] font-semibold text-muted sm:hidden">· {profile.age}</span>}
            {profile.verified && <VerifiedBadge className="shrink-0 text-[17px]" />}
          </h3>
          <p className="text-[11px] font-bold tracking-[.6px] text-muted max-sm:hidden">{profile.code}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted sm:hidden"><FaLocationDot aria-hidden="true" className="text-[#b18433]" /> {[t(profile.city), t(profile.country)].filter(Boolean).join(', ') || '—'}</p>
          <dl className="mt-4 grid gap-2.5 border-t border-[#efe7d6] pt-4 sm:hidden">
            {[['Education', profile.education], ['Profession', profile.profession], ['Marital status', profile.maritalStatus]].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[.7px] text-muted">{t(label)}</dt>
                <dd className="text-[14px] font-semibold text-navy">{value ? t(value) : '—'}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-2 grid gap-0.5 max-sm:hidden">
            <Row icon={FaCakeCandles}>{t('{count} Years', { count: profile.age })}{profile.maritalStatus ? ` · ${t(profile.maritalStatus)}` : ''}</Row>
            <Row icon={FaBriefcase}>{t(profile.profession) || '—'}</Row>
            {profile.education && <Row icon={FaGraduationCap}>{t(profile.education)}</Row>}
            <Row icon={FaLocationDot}>{[t(profile.city), t(profile.country)].filter(Boolean).join(', ') || '—'}</Row>
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 max-sm:mx-3 max-sm:mb-3 sm:mt-auto sm:pt-4">
        <Link href={href} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-navy px-4 text-[13px] font-bold text-white no-underline shadow-[0_6px_14px_#062b4e33] transition-colors hover:bg-dark hover:text-white max-sm:min-h-[50px] max-sm:basis-full max-sm:justify-between max-sm:rounded-xl max-sm:bg-cream max-sm:px-[15px] max-sm:text-navy max-sm:shadow-none max-sm:hover:bg-[#efe6d3] max-sm:hover:text-navy">
          {t('View Profile')} <FaArrowRight aria-hidden="true" className="text-[13px] sm:hidden rtl:-scale-x-100" />
        </Link>
        {locked && (
          <Link href={`${href}#unlock`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full max-sm:min-h-[50px] max-sm:basis-full max-sm:rounded-xl bg-[linear-gradient(135deg,#f4d889,#c99432)] px-4 text-[13px] font-extrabold text-dark no-underline shadow-[0_6px_14px_#c9943240] transition-transform hover:-translate-y-px">
            <FaLock aria-hidden="true" className="text-[11px]" /> {unlockCost === 1 ? t('Unlock · 1 credit') : t('Unlock · {cost} credits', { cost: unlockCost })}
          </Link>
        )}
        {saved !== undefined && <SaveButton code={profile.code} saved={saved} variant="round" />}
      </div>
      {type === 'premium' && <p className="mt-2 flex items-center max-sm:mx-3 max-sm:mb-3 gap-1.5 text-[11.5px] font-semibold text-[#806126]"><FaRing aria-hidden="true" /> {t('Introduced personally by our consultants')}</p>}
    </article>
  );
}
