'use client';

import { useState, useTransition } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { toggleSaved } from '@/app/actions/member';
import { useT } from '@/components/i18n/LanguageProvider';

const styles = {
  overlay: 'absolute end-3 top-3 z-10 size-9 justify-center rounded-full bg-[var(--d-overlay,#fcfbf8ed)] shadow-[0_2px_8px_#03223f26] hover:scale-105',
  round: 'size-11 shrink-0 justify-center rounded-full border border-line bg-white shadow-[0_2px_8px_#03223f14] hover:bg-cream',
  button: 'gap-2 rounded-[9px] border border-line bg-white px-[21px] py-[14px] text-[13px] font-extrabold leading-[19.5px] hover:bg-cream max-m:px-[17px] max-m:py-3 max-m:text-xs',
};

export function SaveButton({ code, saved: initial, variant = 'overlay' }) {
  const t = useT();
  const [saved, setSaved] = useState(initial);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaved(code, next);
      if (!result?.ok) setSaved(!next);
    });
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={saved} aria-label={t(saved ? 'Remove from saved profiles' : 'Save profile')} className={`inline-flex cursor-pointer items-center text-navy transition duration-200 ${styles[variant]}`}>
      {saved ? <FaHeart aria-hidden="true" className="text-[#b18433]" /> : <FaRegHeart aria-hidden="true" />}
      {variant === 'button' && t(saved ? 'Saved' : 'Save profile')}
    </button>
  );
}
