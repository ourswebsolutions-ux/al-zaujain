'use client';

import { FaMoon, FaSun } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { THEME_COOKIE } from '@/lib/theme.js';

export function ThemeToggle({ theme, onChange, className = '' }) {
  const t = useT();
  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    onChange(next);
  };
  return (
    <button type="button" onClick={toggle} aria-label={t(next === 'dark' ? 'Switch to dark mode' : 'Switch to light mode')} title={t(next === 'dark' ? 'Switch to dark mode' : 'Switch to light mode')} className={`grid size-10 cursor-pointer place-items-center rounded-full text-[15px] transition-colors ${className}`}>
      {next === 'dark' ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
    </button>
  );
}
