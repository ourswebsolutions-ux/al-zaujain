'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';
import { FaArrowRight, FaBriefcase, FaCheck, FaChevronRight, FaCrown, FaLocationDot, FaLock, FaLockOpen, FaUser } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { PhotoLock, useUnlock } from '@/components/payments/UnlockProvider';
import { ProposalCard } from '@/components/profile/ProposalCard';
import { CardPhoto } from '@/components/profile/CardPhoto';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { GlowButton, GradientHeading, Ornament } from './HomeUi';

const RIBBON = {
  public: ['Free', 'bg-[#1f8a3a] text-white'],
  paid: ['Premium', 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark'],
  premium: ['Exclusive', 'bg-navy text-champagne'],
};

/**
 * The proposal card from the homepage design: a round portrait on the left with a status button over
 * its edge, the name, age, work and place on the right, and "Profile Detail". It receives only public
 * card fields; photos stay blurred where the bureau's rules say so.
 */
function HomeProfileCard({ profile }) {
  const t = useT();
  const { isUnlocked, photoLocked } = useUnlock();
  const type = profile.type ?? 'paid';
  const unlocked = type === 'paid' && isUnlocked(profile.code);
  const href = `/profile/${profile.code}`;
  const [ribbon, ribbonClass] = RIBBON[type] ?? RIBBON.paid;
  const status = type === 'premium'
    ? { icon: FaCrown, className: 'bg-navy text-champagne', title: 'Exclusive proposal, introduced by our consultants' }
    : type === 'paid' && !unlocked
      ? { icon: FaLock, className: 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark', title: 'Premium profile: unlock with credits' }
      : { icon: FaLockOpen, className: 'bg-[#1f8a3a] text-white', title: unlocked ? 'Unlocked for you' : 'Free profile' };
  return (
    <article className="relative h-full rounded-[10px] bg-[#fcf9f2] p-2.5 shadow-[5px_5px_5px_#0000003d] transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(.25,.8,.25,1)] hover:-translate-y-0.5 hover:shadow-[7px_9px_14px_#00000033]">
      <span className={`absolute -end-1.5 top-2.5 z-10 py-0.5 pe-2.5 ps-3.5 text-[11px] font-bold [clip-path:polygon(8px_0,100%_0,100%_100%,8px_100%,0_50%)] rtl:[clip-path:polygon(0_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,0_100%)] ${ribbonClass}`}>{t(ribbon)}</span>
      <div className="grid h-full grid-cols-[5fr_7fr] items-center gap-3 max-[360px]:grid-cols-[4fr_7fr]">
        <Link href={href} aria-label={t('View proposal {code}', { code: profile.code })} className="relative block self-center no-underline">
          <span className="relative mx-auto block aspect-[140/150] w-full max-w-[140px] overflow-hidden rounded-[50%] border-2 border-[#b18433] bg-[#ece3d2] shadow-[0_6px_16px_#062b4e26]">
            {profile.photo ? (
<CardPhoto profile={profile} alt={t('Portrait of {name}', { name: profile.name })} />
            ) : (
              <span className="absolute inset-0 grid place-items-center"><Image src="/images/logo.png" alt="" width={72} height={72} className="w-[55%] opacity-60" /></span>
            )}
            {profile.photo && photoLocked && <PhotoLock type={type} code={profile.code} className="absolute inset-0 rounded-[50%]" />}
          </span>
          <span title={t(status.title)} className={`absolute bottom-1 start-[6%] z-10 grid size-10 place-items-center rounded-full border-[3px] border-white text-[14px] shadow-[0_4px_12px_#03223f40] max-sm:size-9 ${status.className}`}>
            <status.icon aria-hidden="true" />
            <span className="sr-only">{t(status.title)}</span>
          </span>
        </Link>
        <div className="min-w-0 py-2 pe-1">
          <h3 className="mb-1.5 flex min-w-0 items-center gap-1.5 pe-12 text-[20px] font-semibold leading-tight text-navy max-sm:text-[18px]">
            <Link href={href} className="min-w-0 truncate capitalize text-inherit no-underline hover:text-[#a17a33]">{profile.name}</Link>
            {profile.verified && <VerifiedBadge className="shrink-0 text-[15px]" />}
          </h3>
          <ul className="grid gap-0.5 text-[15px] font-medium capitalize text-[#343434] max-sm:text-[14px]">
            <li className="flex min-w-0 items-center gap-2.5"><FaUser aria-hidden="true" className="w-3.5 shrink-0 text-[#c8c8c8]" /><span className="truncate">{t('{count} Years', { count: profile.age })}</span></li>
            <li className="flex min-w-0 items-center gap-2.5"><FaBriefcase aria-hidden="true" className="w-3.5 shrink-0 text-[#c8c8c8]" /><span className="truncate">{profile.profession ? t(profile.profession) : t('Profession')}</span></li>
            <li className="flex min-w-0 items-center gap-2.5"><FaLocationDot aria-hidden="true" className="w-3.5 shrink-0 text-[#c8c8c8]" /><span className="truncate">{[t(profile.city), t(profile.country)].filter(Boolean).join(', ') || '—'}</span></li>
          </ul>
          <Link href={href} className="mt-3 inline-flex min-h-9 items-center rounded-md bg-navy px-3.5 text-[14px] font-medium text-white no-underline shadow-[0_4px_10px_#062b4e40] transition-colors hover:bg-[#a17a33] hover:text-white">{t('Profile Detail')}</Link>
        </div>
      </div>
    </article>
  );
}

/**
 * One proposals section of the homepage (Pakistan, Overseas or Gulf). Each tab is a city, country or
 * region with its newest approved proposals; the buttons open the full, filterable list.
 */
export function ProposalShowcase({ id, title, highlight, tabs, intro }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const panelId = useId();
  const tab = tabs[active];
  const name = t(tab.label);
  const link = (gender) => `${tab.href}${tab.href.includes('?') ? '&' : '?'}gender=${gender}`;
  // A tab may name itself ("Willing To Be A Second Wife"); otherwise it reads "{place} Proposals".
  const tabName = (item) => (item.tabLabel ? t(item.tabLabel) : t('{place} Proposals', { place: t(item.label) }));
  const links = tab.links ?? [{ label: 'View Female Proposals', href: link('female') }, { label: 'View Male Proposals', href: link('male') }];
  return (
    <section id={id} className="scroll-mt-[90px] bg-[linear-gradient(180deg,#fdf8f0,#f8f1e4)] px-[5%] py-[60px] font-sans text-navy max-sm:px-3.5 max-sm:py-11">
      <div className="mx-auto w-full max-w-[1296px]">
        <header className="mb-8 text-center max-sm:mb-5">
          <h2 className="text-[40px] font-bold leading-[1.2] tracking-[1px] max-p:text-[34px] max-sm:text-[27px]">
            <span className="text-navy">{t(title)}</span>{' '}
            <GradientHeading as="span">{t(highlight)}</GradientHeading>
          </h2>
          <Ornament className="mt-4" />
        </header>

        {tabs.length > 1 && (
          <>
            <div role="tablist" aria-label={t(`${title} ${highlight}`)} className="mb-9 flex flex-wrap justify-center gap-x-5 gap-y-3 max-sm:hidden">
              {tabs.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-controls={panelId}
                  onClick={() => setActive(index)}
                  className={`min-h-11 cursor-pointer rounded-full px-[25px] text-[14px] font-semibold capitalize transition-all duration-300 ${index === active ? 'bg-[linear-gradient(135deg,#062b4e,#0d3d6b)] text-white shadow-[0_10px_20px_#062b4e40]' : 'border border-[#e0aa3e4d] bg-white text-[#535e74] shadow-[0_4px_10px_#0000000d] hover:-translate-y-0.5 hover:border-gold hover:text-navy'}`}
                >
                  {tabName(item)}
                </button>
              ))}
            </div>
            <div className="mb-6 hidden rounded-[20px] bg-white p-3 shadow-[0_8px_24px_#062b4e12] max-sm:block">
              <p className="mb-2 text-center text-[12px] font-semibold capitalize text-[#a17a33]">{t('Tap to switch')}</p>
              <div role="tablist" aria-label={t(`${title} ${highlight}`)} className="grid gap-2">
                {tabs.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={index === active}
                    aria-controls={panelId}
                    onClick={() => setActive(index)}
                    className={`flex min-h-11 cursor-pointer items-center justify-between rounded-[10px] px-4 text-start text-[14px] font-semibold capitalize transition-colors ${index === active ? 'bg-[linear-gradient(135deg,#062b4e,#0d3d6b)] text-white shadow-[0_6px_14px_#062b4e40]' : 'border border-[#e9dcc0] bg-[#fdfaf4] text-navy'}`}
                  >
                    <span>{tabName(item)}</span>
                    {index === active ? <FaCheck aria-hidden="true" /> : <FaChevronRight aria-hidden="true" className="text-[11px] rtl:-scale-x-100" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div id={panelId} role="tabpanel" className="rounded-[20px] bg-white px-10 py-10 shadow-[0_15px_40px_#062b4e12] max-p:px-6 max-sm:px-3 max-sm:py-7">
          <div className="mb-8 text-center max-sm:mb-6">
            <h3 className="text-[30px] font-bold leading-tight max-sm:text-[22px]">
              {tab.tabLabel ? <GradientHeading as="span">{t(tab.tabLabel)}</GradientHeading> : <><span className="text-navy">{name}</span> <GradientHeading as="span">{t('Proposals')}</GradientHeading></>}
            </h3>
            <Ornament className="mb-3 mt-3" />
            <p className="mx-auto max-w-[640px] text-[16px] font-medium text-[#343434] max-sm:text-[14px]">{t(tab.intro ?? intro, { place: name })}</p>
          </div>

          {tab.profiles.length > 0 ? (
            <ul className="grid grid-cols-3 gap-x-5 gap-y-7 max-n:grid-cols-2 max-t:grid-cols-1 max-sm:gap-y-5">
              {tab.profiles.map((profile) => (
                <li key={profile.code} className="min-w-0">
                  {/* Phones get the tall card with the large photo; wider screens the side-by-side card. */}
                  <div className="h-full max-sm:hidden"><HomeProfileCard profile={profile} /></div>
                  <div className="sm:hidden"><ProposalCard profile={profile} /></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mx-auto max-w-[520px] rounded-2xl border border-dashed border-[#e2d3b3] bg-[#fdfaf4] px-6 py-10 text-center">
              <p className="mb-4 text-[15px] text-muted">{tab.tabLabel ? t('New proposals will appear here soon.') : t('New {place} proposals will appear here soon.', { place: name })}</p>
              <Link href="/submit-profile" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white no-underline hover:bg-dark hover:text-white">{t('Submit a profile')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></Link>
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-4 max-sm:mt-8">
            {links.map((item) => <GlowButton key={item.href} href={item.href}><span>{t(item.label)}</span> <FaArrowRight aria-hidden="true" className="text-gold rtl:-scale-x-100" /></GlowButton>)}
          </div>
        </div>
      </div>
    </section>
  );
}
