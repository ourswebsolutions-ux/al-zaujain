'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import { FaArrowUp, FaWhatsapp } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const button = 'grid size-[50px] place-items-center rounded-full no-underline shadow-[0_4px_16px_#03223f24] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold max-g:size-[46px]';

export function FloatingActions({ whatsapp }) {
  const t = useT();
  const [showTop, setShowTop] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const update = () => setShowTop(window.scrollY >= 450);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    // Soften large mouse-wheel jumps; trackpads, zoom and scrollable panels stay native.
    const onWheel = (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.deltaX !== 0) return;
      if (event.target.closest?.('[data-native-scroll], textarea, select, [contenteditable]')) return;
      const coarse = event.deltaMode !== 0 || (Number.isInteger(event.deltaY) && Math.abs(event.deltaY) >= 80);
      if (!coarse || !event.cancelable) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      event.preventDefault();
      window.scrollBy({ top: Math.sign(pixels) * Math.min(Math.abs(pixels) * 0.6, 100), behavior: 'instant' });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const scrollToTop = (event) => {
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1050] h-[3px] bg-[#062b4e12]">
        <motion.span className="block h-full origin-left bg-gold rtl:origin-right" style={{ scaleX: scrollYProgress }} />
      </div>
      <div aria-label={t('Quick actions')} className="fixed bottom-[22px] end-[22px] z-[1000] flex flex-col gap-3 max-g:bottom-3 max-g:end-3 max-g:gap-2.5">
        <a
          href="#top"
          onClick={scrollToTop}
          aria-label={t('Scroll back to top')}
          aria-hidden={!showTop}
          tabIndex={showTop ? 0 : -1}
          className={`${button} border border-gold bg-navy text-lg text-champagne ${showTop ? '' : 'pointer-events-none invisible translate-y-3 scale-[.94] opacity-0'}`}
        >
          <FaArrowUp aria-hidden="true" />
        </a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" aria-label={t('Chat with Al Zaujain on WhatsApp')} className={`${button} bg-whatsapp text-[27px] text-white`}>
          <FaWhatsapp aria-hidden="true" />
        </a>
      </div>
    </>
  );
}
