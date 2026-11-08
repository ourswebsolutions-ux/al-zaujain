'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from './LanguageProvider';
import { LANG_COOKIE } from '@/lib/i18n/core.js';

const YEAR = 60 * 60 * 24 * 365;

// The cookie keeps the choice across pages and visits.
export function LanguageSwitch({ className = '' }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next) => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  const option = (value, label, extra) => (
    <button type="button" onClick={() => choose(value)} aria-pressed={lang === value} className={`cursor-pointer px-1.5 transition-opacity duration-300 ${lang === value ? 'opacity-100' : 'opacity-55 hover:opacity-100'} ${extra}`}>{label}</button>
  );

  return (
    <div role="group" aria-label="Language" dir="ltr" className={`flex items-center text-[.8rem] transition-opacity ${pending ? 'opacity-50' : ''} ${className}`}>
      {option('en', 'EN', 'tracking-[.14em]')}
      <span aria-hidden="true" className="h-3 w-px bg-current opacity-30" />
      {option('ur', 'اردو', 'font-[family-name:var(--font-naskh)]')}
    </div>
  );
}
