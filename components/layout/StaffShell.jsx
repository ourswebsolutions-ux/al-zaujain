'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaXmark } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { DARK_THEME, KEEP_LIGHT } from '@/lib/theme.js';

export function StaffShell({ title, items, footer, theme: initialTheme = 'light', children }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const root = items[0].href;
  return (
    <div className={`flex min-h-dvh bg-[var(--d-bg,#f4f5f8)] text-ink ${theme === 'dark' ? DARK_THEME : ''}`}>
      <aside className={`${KEEP_LIGHT} fixed inset-y-0 left-0 z-40 w-[250px] overflow-y-auto bg-navy text-white transition-transform duration-200 b:sticky b:top-0 b:h-dvh b:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/" className="flex items-center gap-2.5 border-b border-white/10 p-5 text-white no-underline">
          <Image src="/images/logo.png" alt="Al Zaujain" width={44} height={44} className="rounded-full bg-white" />
          <span className="text-sm font-bold leading-tight tracking-[.5px]">AL ZAUJAIN<small className="block text-[10px] font-medium text-champagne">{t(title)}</small></span>
        </Link>
        <nav aria-label={t(title)} className="p-3">
          {items.map((item) => {
            if (item.group) return <p key={item.group} className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[1.4px] text-[#8fa3b5]">{t(item.group)}</p>;
            const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-[13px] no-underline transition-colors ${active ? 'bg-gold-soft font-semibold text-dark' : 'text-[#e0e6eb] hover:bg-white/8'}`}>
                {t(item.label)}
                {item.badge > 0 && <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-navy text-white' : 'bg-gold text-dark'}`}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1.5"><LanguageSwitch className="text-white" /><ThemeToggle theme={theme} onChange={setTheme} className="text-white hover:bg-white/10" /></div>
          {footer}
        </div>
      </aside>
      {open && <button type="button" aria-label={t('Close menu')} onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-dark/50 b:hidden" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3 b:hidden">
          <button type="button" aria-label={t('Open menu')} onClick={() => setOpen(!open)} className="cursor-pointer text-lg text-navy">{open ? <FaXmark aria-hidden="true" /> : <FaBars aria-hidden="true" />}</button>
          <strong className="text-sm">{t(title)}</strong>
        </div>
        <main className="p-7 max-m:p-4">{children}</main>
      </div>
    </div>
  );
}
