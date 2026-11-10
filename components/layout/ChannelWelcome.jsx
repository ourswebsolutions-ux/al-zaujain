'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { FaBell, FaCheck, FaWhatsapp, FaXmark } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const KEY = 'az_channel_welcome';
const LATER_DAYS = 7;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function remember(choice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    /* Private browsing: the popup may show again next visit, which is fine. */
  }
}

/**
 * The welcome screen inviting a first-time visitor to the official WhatsApp Channel. It appears once,
 * a moment after the first page loads. "Join" is remembered for good, "Maybe later" for a week, and it
 * never reappears while the visitor moves between pages.
 */
export function ChannelWelcome({ url }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);

  useEffect(() => {
    const saved = read();
    if (saved?.choice === 'joined') return undefined;
    if (saved?.choice === 'later' && Date.now() - saved.at < LATER_DAYS * 86400000) return undefined;
    try {
      if (sessionStorage.getItem(KEY)) return undefined;
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    dialog.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') { remember('later'); setOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const later = () => { remember('later'); setOpen(false); };
  const joined = () => { remember('joined'); setOpen(false); };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#03223fb3] p-4 backdrop-blur-[3px] motion-safe:animate-fade-in" onClick={(event) => { if (event.target === event.currentTarget) later(); }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="channel-welcome-title" className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] outline-none bg-white font-sans text-navy shadow-[0_30px_80px_#00000059] motion-safe:animate-pop-in">
        <button type="button" onClick={later} aria-label={t('Close')} className="absolute end-3 top-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/35">
          <FaXmark aria-hidden="true" />
        </button>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#075e54,#128c7e_55%,#25d366)] px-7 pb-14 pt-9 text-center text-white">
          <span aria-hidden="true" className="absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -bottom-16 -start-8 size-40 rounded-full bg-white/10" />
          <span className="relative mx-auto mb-4 grid size-[74px] place-items-center rounded-full bg-white text-[42px] text-[#25d366] shadow-[0_10px_25px_#00000033]">
            <FaWhatsapp aria-hidden="true" />
          </span>
          <p className="relative text-[12px] font-semibold uppercase tracking-[2.5px] text-white/85">{t('Official WhatsApp Channel')}</p>
          <h2 id="channel-welcome-title" className="relative mt-1.5 text-[24px] font-bold leading-tight max-sm:text-[21px]">{t('Join Al Zaujain on WhatsApp')}</h2>
        </div>
        <div className="relative -mt-8 px-6 pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-4 border-white bg-white shadow-[0_8px_20px_#062b4e26]">
            <Image src="/images/logo.png" alt={t('Al Zaujain logo')} width={56} height={56} className="rounded-full" />
          </div>
          <p className="mb-4 text-center text-[15px] leading-6 text-[#47566a]">{t('Get new proposals, rishta tips and bureau announcements first, straight on WhatsApp.')}</p>
          <ul className="mb-5 grid gap-2 text-[14px]">
            {['New proposals every week', 'Announcements and events', 'Free to join, leave any time'].map((item) => (
              <li key={item} className="flex items-center gap-2.5"><FaCheck aria-hidden="true" className="shrink-0 text-[#25d366]" /> {t(item)}</li>
            ))}
          </ul>
          <a href={url} target="_blank" rel="noopener" onClick={joined} className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#25d366] px-6 text-[16px] font-bold text-white no-underline shadow-[0_10px_24px_#25d36659] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#1ebe5a] hover:text-white">
            <FaBell aria-hidden="true" /> {t('Join WhatsApp Channel')}
          </a>
          <button type="button" onClick={later} className="mt-2 min-h-11 w-full cursor-pointer rounded-full text-[14px] font-semibold text-muted transition hover:bg-[#f4f4f4] hover:text-navy">{t('Maybe later')}</button>
        </div>
      </div>
    </div>
  );
}
