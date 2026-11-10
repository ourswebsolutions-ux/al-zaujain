'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { BannerShade, BannerText } from './BannerText';

function Slide({ banner, first, active }) {
  const t = useT();
  const words = banner.showText && (banner.heading || banner.text || banner.cta || banner.cta2);
  return (
    <div
      aria-hidden={!active}
      inert={!active ? true : undefined}
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${active ? 'z-[1] opacity-100' : 'opacity-0'}`}
    >
      <picture>
        {banner.mobileSrc && <source media="(max-width: 640px)" srcSet={banner.mobileSrc} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.src} alt={banner.heading || t('Al Zaujain Marriage Bureau')} loading={first ? 'eager' : 'lazy'} fetchPriority={first ? 'high' : 'auto'} className={`absolute inset-0 size-full object-cover ${banner.position ?? 'object-center'}`} />
      </picture>
      {!words && banner.href && (
        /^(https?:|tel:|mailto:)/i.test(banner.href)
          ? <a href={banner.href} target="_blank" rel="noopener" aria-label={t('Open')} className="absolute inset-0 z-[2]" />
          : <Link href={banner.href} aria-label={t('Open')} className="absolute inset-0 z-[2]" />
      )}
      {words && (
        <>
          <BannerShade banner={banner} />
          <div className="absolute inset-x-[6%] inset-y-[8%] group-data-[search]/hero:bottom-[130px] max-sm:inset-0 max-sm:group-data-[search]/hero:bottom-0"><BannerText banner={banner} /></div>
        </>
      )}
    </div>
  );
}

/**
 * The homepage banner. One banner stands still; two or more cross-fade every few seconds, pause
 * while the visitor points at them or the tab is hidden, and can be changed with arrows, dots or a swipe.
 */
export function HeroBanner({ banners, search = null }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touch, setTouch] = useState(null);
  const count = banners.length;
  const go = useCallback((next) => setIndex((current) => (next(current) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const timer = setInterval(() => { if (!document.hidden) go((current) => current + 1); }, 6000);
    return () => clearInterval(timer);
  }, [count, paused, go]);

  return (
    <section
      aria-roledescription={count > 1 ? 'carousel' : undefined}
      aria-label={t('Al Zaujain highlights')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => setTouch(event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touch === null || count < 2) return;
        const delta = event.changedTouches[0].clientX - touch;
        if (Math.abs(delta) > 45) go((current) => current + (delta < 0 ? 1 : -1));
        setTouch(null);
      }}
      data-search={search ? '' : undefined}
      className="group/hero relative h-[clamp(420px,36vw,560px)] w-full overflow-hidden bg-dark max-sm:h-[min(118vw,520px)]"
    >
      <h1 className="sr-only">{t('Al Zaujain Marriage Bureau')} · {t('Government Registered Marriage Bureau')}</h1>
      {banners.map((banner, i) => <Slide key={banner.id} banner={banner} first={i === 0} active={i === index} />)}

      {count > 1 && (
        <>
          <button type="button" onClick={() => go((current) => current - 1)} aria-label={t('Previous banner')} className="absolute start-4 top-1/2 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/85 text-navy shadow-[0_6px_18px_#0000002e] transition hover:bg-white max-sm:hidden">
            <FaChevronLeft aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <button type="button" onClick={() => go((current) => current + 1)} aria-label={t('Next banner')} className="absolute end-4 top-1/2 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/85 text-navy shadow-[0_6px_18px_#0000002e] transition hover:bg-white max-sm:hidden">
            <FaChevronRight aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2 group-data-[search]/hero:bottom-[104px] max-sm:bottom-4 max-sm:group-data-[search]/hero:bottom-[84px]">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('Show banner {number}', { number: i + 1 })}
                aria-current={i === index}
                className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-gold' : 'w-2.5 bg-white/70 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
      {search && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-40 bg-[linear-gradient(180deg,transparent,#03223f80)]" />
          <div className="absolute inset-x-0 bottom-8 z-20 max-sm:bottom-5">{search}</div>
        </>
      )}
    </section>
  );
}
