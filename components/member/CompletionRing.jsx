'use client';

import { motion } from 'framer-motion';
import { useT } from '@/components/i18n/LanguageProvider';

export function CompletionRing({ percent }) {
  const t = useT();
  return (
    <div role="img" aria-label={t('Profile {percent}% complete', { percent })} className="relative size-[104px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff22" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r="44" fill="none" stroke="#e4b653" strokeWidth="7" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: percent / 100 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-nunito text-2xl font-extrabold text-white">{percent}%</span>
    </div>
  );
}
