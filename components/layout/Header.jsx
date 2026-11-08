'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnnouncementBar } from './AnnouncementBar';
import { Brand } from './Brand';
import { useT } from '@/components/i18n/LanguageProvider';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { Arrow, ButtonLink } from '@/components/ui/Button';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/proposals', label: 'Proposals', menu: true },
  { href: '/consultants', label: 'Consultants' },
  { href: '/#why-choose', label: 'Why Al Zaujain' },
  { href: '/#registration', label: 'Registration' },
  { href: '/#android-app', label: 'Android app' },
  { href: '/#questions', label: 'FAQs' },
  { href: '/#contact', label: 'Contact us' },
];

const navLink = "relative py-2 text-xs font-medium leading-[18px] no-underline transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-200 after:content-[''] hover:text-[#9b712b] hover:after:scale-x-100 focus-visible:text-[#9b712b] focus-visible:after:scale-x-100";

export function Header({ phone, phoneIntl, user, unread = 0, categories = [], announcements = [] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const accountHref = user ? (user.role === 'admin' ? '/admin' : user.role === 'consultant' ? '/consultant' : '/dashboard') : null;
  const accountButton = 'gap-5! px-[17px]! py-[11px]! max-m:gap-[5px]! max-m:px-2.5! max-m:py-[9px]! max-m:text-[9px]! max-m:leading-[13.5px]!';

  return (
    <>
      <div className="flex items-center justify-between gap-[15px] bg-navy px-[4.5%] py-2.5 text-[10px] leading-[15px] text-white max-m:gap-2.5 max-m:px-[5%] max-m:py-[9px] max-m:text-[8px] max-m:leading-3">
        <AnnouncementBar messages={announcements} />
        <a href={`tel:${phoneIntl}`} className="shrink-0 text-champagne no-underline">{t('Need help?')} <span dir="ltr">{phone}</span></a>
      </div>

      <div className="relative z-20 flex items-center justify-between gap-5 border-b border-[#e9e9e5] bg-white px-[4.5%] py-5 max-m:gap-2.5 max-m:px-[5%] max-m:py-[15px]">
        <Brand />
        <nav aria-label={t('Main navigation')} className="flex gap-[11px] max-n:hidden">
          {NAV.map((item) => item.menu ? (
            <div key={item.href} className="group relative flex items-center">
              <Link href={item.href} className={navLink}>{t(item.label)}</Link>
              <div className="invisible absolute left-0 top-full z-30 min-w-52 translate-y-1 rounded-xl border border-line bg-white p-2 opacity-0 shadow-[0_12px_30px_#03223f18] transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {categories.map((category) => (
                  <Link key={category.slug} href={`/proposals/${category.slug}`} className="block rounded-lg px-3 py-2 text-xs font-medium no-underline hover:bg-cream hover:text-[#90691f]">
                    {t(category.name)}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={item.href} href={item.href} className={navLink}>{t(item.label)}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-5 max-n:gap-3 max-m:gap-2.5">
          <LanguageSwitch className="text-navy" />
          {user ? (
            <>
              {unread > 0 && (
                <Link href="/messages" className="grid size-6 place-items-center rounded-full bg-gold text-[10px] font-bold text-dark no-underline" aria-label={t('{count} unread messages', { count: unread })}>
                  {unread}
                </Link>
              )}
              <ButtonLink href={accountHref} size="md" className={accountButton}>
                {t(user.role === 'admin' ? 'Admin' : 'Dashboard')} <Arrow />
              </ButtonLink>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold leading-[18px] text-navy no-underline max-m:hidden">{t('Login')}</Link>
              <ButtonLink href="/register" size="md" className={accountButton}>
                {t('Register now')} <Arrow />
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={t(open ? 'Close navigation' : 'Open navigation')}
            className="hidden cursor-pointer px-1.5 py-px text-[23px] leading-[34.5px] text-navy max-n:block"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" aria-label={t('Mobile navigation')} className="relative z-20 bg-white px-[5%] py-[15px] n:hidden">
          {[...NAV, ...(user ? [] : [{ href: '/login', label: 'Login' }])].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block p-2.5 text-navy no-underline hover:bg-cream hover:text-[#90691f]">
              {t(item.label)}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
