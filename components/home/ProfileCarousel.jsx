'use client';

import { useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { ProposalCard } from '@/components/profile/ProposalCard';
import { useLang, useT } from '@/components/i18n/LanguageProvider';

const SPEED = 0.035; // pixels per millisecond while gliding
const MIN_CARDS = 8; // enough cards that the loop never shows a gap on wide screens

// A continuous, seamless loop: the cards are shown twice and the track wraps by one set's width.
export function ProfileCarousel({ profiles }) {
  const t = useT();
  const dir = useLang() === 'ur' ? 'rtl' : 'ltr';
  const viewport = useRef(null);
  const track = useRef(null);
  const state = useRef({ offset: 0, target: null, hover: false, focus: false, drag: null, moved: false });

  const repeats = Math.max(1, Math.ceil(MIN_CARDS / profiles.length));
  const set = Array.from({ length: repeats }, () => profiles).flat();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const current = state.current;
    let frame;
    let last = performance.now();
    const loop = (now) => {
      const elapsed = Math.min(now - last, 64);
      last = now;
      const width = track.current ? track.current.scrollWidth / 2 : 0;
      if (current.target !== null) {
        current.offset += (current.target - current.offset) * Math.min(1, elapsed / 90);
        if (Math.abs(current.target - current.offset) < 0.5) { current.offset = current.target; current.target = null; }
      } else if (!current.hover && !current.focus && !current.drag && !reduced.matches && !document.hidden) {
        current.offset += SPEED * elapsed;
      }
      if (width > 0) {
        if (current.offset >= width) { current.offset -= width; if (current.target !== null) current.target -= width; }
        if (current.offset < 0) { current.offset += width; if (current.target !== null) current.target += width; }
      }
      if (track.current) track.current.style.transform = `translate3d(${-current.offset}px,0,0)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const step = () => {
    const card = track.current?.firstElementChild;
    if (!card) return 320;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track.current).columnGap || '0');
  };
  const move = (direction) => {
    const current = state.current;
    current.target = (current.target ?? current.offset) + direction * step();
  };

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    state.current.drag = { x: event.clientX, offset: state.current.offset, id: event.pointerId };
    state.current.moved = false;
    state.current.target = null;
  };
  const onPointerMove = (event) => {
    const { drag } = state.current;
    if (!drag || drag.id !== event.pointerId) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 6 && !state.current.moved) {
      state.current.moved = true;
      viewport.current.setPointerCapture(event.pointerId);
    }
    if (state.current.moved) state.current.offset = drag.offset - distance;
  };
  const onPointerUp = () => { state.current.drag = null; };
  // A swipe must not also open the card under the finger.
  const onClickCapture = (event) => {
    if (state.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      state.current.moved = false;
    }
  };

  const arrow = 'absolute top-1/2 z-10 grid size-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-white/95 text-navy shadow-[0_10px_28px_#03223f22] transition hover:bg-navy hover:text-white max-m:size-10';

  return (
    <div
      className="relative"
      onMouseEnter={() => { state.current.hover = true; }}
      onMouseLeave={() => { state.current.hover = false; state.current.drag = null; }}
      onFocus={() => { state.current.focus = true; }}
      onBlur={() => { state.current.focus = false; }}
    >
      <div
        ref={viewport}
        role="region"
        aria-roledescription={t('carousel')}
        aria-label={t('Featured proposals')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        className="touch-pan-y select-none overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]"
      >
        <ul ref={track} dir="ltr" className="flex w-max gap-5 will-change-transform max-m:gap-4">
          {[...set, ...set].map((profile, index) => {
            const copy = index >= profiles.length;
            return (
              <li key={`${profile.code}-${index}`} dir={dir} aria-hidden={copy || undefined} inert={copy || undefined} className="w-[290px] shrink-0 max-m:w-[76vw] [&_img]:pointer-events-none">
                <ProposalCard profile={profile} tag={profile.featured ? 'Featured' : undefined} />
              </li>
            );
          })}
        </ul>
      </div>
      <button type="button" onClick={() => move(-1)} aria-label={t('Previous proposals')} className={`${arrow} -start-3 max-m:start-1`}><FaChevronLeft aria-hidden="true" className="rtl:-scale-x-100" /></button>
      <button type="button" onClick={() => move(1)} aria-label={t('Next proposals')} className={`${arrow} -end-3 max-m:end-1`}><FaChevronRight aria-hidden="true" className="rtl:-scale-x-100" /></button>
    </div>
  );
}
