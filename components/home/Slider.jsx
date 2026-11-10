'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

/**
 * A horizontal slider of cards. Phones show one card at a time (with a peek of the next) and swipe;
 * wider screens show several, with arrow buttons when there are more than fit. It uses the browser's
 * own scroll snapping, so it is smooth, works with touch, trackpads and keyboards, and never makes the
 * page scroll sideways.
 */
export function Slider({ children, label, perView = 3, className = '' }) {
  const t = useT();
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);
  const width = { 2: 'sm:basis-[calc((100%-24px)/2)]', 3: 'sm:basis-[calc((100%-24px)/2)] lg:basis-[calc((100%-48px)/3)]', 4: 'sm:basis-[calc((100%-24px)/2)] lg:basis-[calc((100%-48px)/3)] xl:basis-[calc((100%-72px)/4)]' }[perView];

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const position = Math.abs(el.scrollLeft);
    setEdges({ start: position < 4, end: position > max - 4 });
    const card = el.firstElementChild;
    if (card) setActive(Math.round(position / (card.getBoundingClientRect().width + 24)));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const step = (direction) => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (!el || !card) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: (card.getBoundingClientRect().width + 24) * direction * (rtl ? -1 : 1), behavior: 'smooth' });
  };
  const goTo = (index) => {
    const el = track.current;
    const card = el?.children[index];
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  const scrollable = !(edges.start && edges.end);
  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className={`relative ${className}`}>
      <div
        ref={track}
        onScroll={update}
        tabIndex={0}
        className={`-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-6 pt-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-scrollbar]:hidden max-sm:gap-4 ${items.length === 1 ? 'justify-center' : ''} ${items.length < perView ? 'lg:justify-center' : ''}`}
      >
        {items.map((child, index) => (
          <div key={child.key ?? index} aria-roledescription="slide" aria-label={t('{number} of {count}', { number: index + 1, count: items.length })} className={`shrink-0 grow-0 basis-[86%] snap-start ${width}`}>
            {child}
          </div>
        ))}
      </div>
      {scrollable && (
        <>
          <button type="button" onClick={() => step(-1)} disabled={edges.start} aria-label={t('Previous')} className="absolute -start-5 top-[45%] z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-navy shadow-[0_6px_18px_#062b4e33] transition hover:bg-navy hover:text-white disabled:pointer-events-none disabled:opacity-0 max-sm:hidden">
            <FaChevronLeft aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <button type="button" onClick={() => step(1)} disabled={edges.end} aria-label={t('Next')} className="absolute -end-5 top-[45%] z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-navy shadow-[0_6px_18px_#062b4e33] transition hover:bg-navy hover:text-white disabled:pointer-events-none disabled:opacity-0 max-sm:hidden">
            <FaChevronRight aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <div className="flex justify-center gap-2">
            {items.map((child, index) => (
              <button key={child.key ?? index} type="button" onClick={() => goTo(index)} aria-label={t('Go to {number}', { number: index + 1 })} aria-current={index === active} className={`h-2 cursor-pointer rounded-full transition-all ${index === active ? 'w-6 bg-gold' : 'w-2 bg-[#d9cdb4] hover:bg-[#c3b08a]'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
