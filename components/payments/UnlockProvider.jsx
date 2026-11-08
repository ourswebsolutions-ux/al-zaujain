'use client';

import { KEEP_LIGHT } from '@/lib/theme.js';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheck, FaEyeSlash, FaLock, FaWhatsapp } from 'react-icons/fa6';
import { buttonClass } from '@/components/ui/Button';
import { useT } from '@/components/i18n/LanguageProvider';

const UnlockContext = createContext({ photoLocked: false, openUnlock: () => {} });

const BENEFITS = ['View original profile photographs.', 'Access contact information.', 'Connect through WhatsApp.', 'Send direct messages.', 'Explore complete profile details.'];

export function UnlockProvider({ photoLocked, signedIn, children }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const openUnlock = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ photoLocked, openUnlock }), [photoLocked, openUnlock]);
  const href = signedIn ? '/dashboard/payments/submit' : '/login?next=/dashboard/payments/submit';

  return (
    <UnlockContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1200] grid place-items-center overflow-y-auto bg-dark/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t('Unlock Full Profile Access')} initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[460px] overflow-hidden rounded-[20px] bg-white shadow-[0_30px_80px_#03223f66]">
              <div className="border-b-[3px] border-gold bg-navy px-8 py-7 text-center text-white">
                <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold-soft/60 text-lg text-gold-soft"><FaLock aria-hidden="true" /></span>
                <h2 className="mt-4 text-[22px] font-semibold leading-tight">{t('Unlock Full Profile Access')}</h2>
                <p className="mt-2 text-[13px] leading-[22px] text-[#c7d3dd]">{t('Get access to complete matrimonial profiles and connect with potential matches.')}</p>
              </div>
              <div className="p-7 max-m:p-5">
                <ul className="grid gap-2.5">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-[13.5px] text-navy"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e4b6532b] text-[9px] text-[#946c13]"><FaCheck aria-hidden="true" /></span>{t(benefit)}</li>
                  ))}
                </ul>
                <Link href={href} onClick={() => setOpen(false)} className={buttonClass('gold', 'lg', 'mt-6 w-full')}>{t('View Payment Options')}</Link>
                <button type="button" onClick={() => setOpen(false)} className="mt-3 block w-full cursor-pointer text-center text-[13px] font-medium text-muted hover:text-navy">{t('Continue Browsing')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UnlockContext.Provider>
  );
}

export const useUnlock = () => useContext(UnlockContext);

// Sits over a blurred photo. Shown on cards, and larger on the profile page.
export function PhotoLock({ large, type = 'paid' }) {
  const t = useT();
  const { photoLocked, openUnlock } = useUnlock();
  // Public profiles are open to everyone, so their photos are never covered.
  if (!photoLocked || type === 'public') return null;
  return (
    <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openUnlock(); }} aria-label={t('Unlock Full Profile Photograph')} className={`${KEEP_LIGHT} absolute inset-0 z-[5] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#03223f33] backdrop-blur-2xl backdrop-saturate-50 text-white`}>
      <span className={`grid place-items-center rounded-full bg-[#03223f99] text-white ${large ? 'size-14 text-xl' : 'size-10 text-base'}`}><FaEyeSlash aria-hidden="true" /></span>
    </button>
  );
}

// Replaces the WhatsApp button for viewers without access. It opens the unlock popup instead.
export function LockedWhatsApp({ label }) {
  const t = useT();
  const { openUnlock } = useUnlock();
  return (
    <button type="button" onClick={openUnlock} className={buttonClass('navy', 'lg', 'cursor-pointer')}>
      <FaWhatsapp aria-hidden="true" /> {t(label)} <FaLock aria-hidden="true" className="text-gold-soft" />
    </button>
  );
}

export function LockedContact({ labels }) {
  const t = useT();
  const { openUnlock } = useUnlock();
  if (labels.length === 0) return null;
  return (
    <section className="mt-7 rounded-xl border border-[#ddcfb1] bg-[#f8f4eb] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy"><FaLock aria-hidden="true" className="text-[#a67b2e]" /> {t('Contact details')}</h3>
      <ul className="grid gap-2">
        {labels.map((label) => (
          <li key={label} className="flex items-center justify-between gap-3 border-b border-dashed border-[#e0d6c1] pb-2 text-sm">
            <span className="text-muted">{t(label)}</span>
            <button type="button" onClick={openUnlock} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#946c13]"><FaLock aria-hidden="true" className="text-[10px]" /> {t('Locked')}</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={openUnlock} className={`${buttonClass('navy', 'md', 'mt-4 cursor-pointer')}`}>{t('Unlock Full Profile Access')}</button>
    </section>
  );
}
