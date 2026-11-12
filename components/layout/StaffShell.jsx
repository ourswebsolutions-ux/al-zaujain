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
      <aside className={`${KEEP_LIGHT} fixed inset-y-0 start-0 z-40 w-[250px] overflow-y-auto border-e border-line bg-white text-navy shadow-[2px_0_14px_#062b4e0a] transition-transform duration-200 b:sticky b:top-0 b:h-dvh b:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full max-b:rtl:translate-x-full'}`}>
        <Link href="/" className="flex items-center gap-2.5 border-b border-line p-5 text-navy no-underline">
          <Image src="/images/logo.png" alt="Al Zaujain" width={44} height={44} className="rounded-full" />
          <span className="text-sm font-bold leading-tight tracking-[.5px]">AL ZAUJAIN<small className="block text-[10px] font-medium text-[#9b712b]">{t(title)}</small></span>
        </Link>
        <nav aria-label={t(title)} className="p-3">
          {items.map((item) => {
            if (item.group) return <p key={item.group} className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[1.4px] text-[#8a94a3]">{t(item.group)}</p>;
            const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-[13px] no-underline transition-colors ${active ? 'bg-navy font-semibold text-white shadow-[0_4px_12px_#062b4e33]' : 'text-[#3d4a5a] hover:bg-[#f6f1e6] hover:text-navy'}`}>
                {t(item.label)}
                {item.badge > 0 && <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-gold text-dark' : 'bg-gold text-dark'}`}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1.5"><LanguageSwitch className="text-navy" /><ThemeToggle theme={theme} onChange={setTheme} className="text-navy hover:bg-[#f6f1e6]" /></div>
          {footer}
        </div>
      </aside>
      {open && <button type="button" aria-label={t('Close menu')} onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-dark/50 b:hidden" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3 b:hidden">
          <button type="button" aria-label={t('Open menu')} onClick={() => setOpen(!open)} className="cursor-pointer text-lg text-navy">{open ? <FaXmark aria-hidden="true" /> : <FaBars aria-hidden="true" />}</button>
          <strong className="text-sm">{t(title)}</strong>
        </div>
        {/* Staff pages are full of emails, codes and typed notes: their text stays as written; headings and buttons are still Title Case. */}
        <main data-plain className="p-7 max-m:p-4">{children}</main>
      </div>
    </div>
  );
}
