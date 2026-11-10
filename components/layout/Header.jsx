'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaArrowRight, FaBars, FaXmark } from 'react-icons/fa6';
import Link from 'next/link';
import { AnnouncementBar } from './AnnouncementBar';
import { Brand } from './Brand';
import { useT } from '@/components/i18n/LanguageProvider';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { Arrow, ButtonLink } from '@/components/ui/Button';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/proposals', label: 'Proposals', menu: true },
  { href: '/packages', label: 'Packages' },
  { href: '/#why-choose', label: 'Why Al Zaujain' },
  { href: '/#registration', label: 'Registration' },
  { href: '/#android-app', label: 'Android app' },
  { href: '/#questions', label: 'FAQs' },
  { href: '/#contact', label: 'Contact us' },
];

const navLink = "relative whitespace-nowrap py-2 text-xs font-medium capitalize leading-[18px] no-underline transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-200 after:content-[''] hover:text-[#9b712b] hover:after:scale-x-100 focus-visible:text-[#9b712b] focus-visible:after:scale-x-100";

export function Header({ phone, phoneIntl, user, unread = 0, categories = [], announcements = [] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The phone menu closes when the page changes or Escape is pressed.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const accountHref = user ? (user.role === 'admin' ? '/admin' : user.role === 'consultant' ? '/consultant' : '/dashboard') : null;
  const accountButton = 'gap-5! px-[17px]! py-[11px]! whitespace-nowrap max-m:gap-1.5! max-m:rounded-full! max-m:px-3.5! max-m:py-2! max-m:text-[11.5px]! max-m:leading-4!';

  return (
    <>
      <div className="flex items-center justify-between gap-[15px] bg-navy px-[4.5%] py-2.5 text-[10px] leading-[15px] text-white max-m:gap-2.5 max-m:px-[5%] max-m:py-[9px] max-m:text-[8px] max-m:leading-3">
        <AnnouncementBar messages={announcements} />
        <a href={`tel:${phoneIntl}`} className="shrink-0 text-champagne no-underline">{t('Need help?')} <span dir="ltr">{phone}</span></a>
      </div>

      <div className="relative z-20 flex items-center justify-between gap-5 border-b border-[#e9e9e5] bg-white px-[4.5%] py-5 max-m:gap-2 max-m:px-4 max-m:py-3">
        <Brand className="min-w-0" />
        <nav aria-label={t('Main navigation')} className="flex gap-[11px] max-[1440px]:gap-[8px] max-n:hidden">
          {NAV.map((item) => item.menu ? (
            <div key={item.href} className="group relative flex items-center">
              <Link href={item.href} className={navLink}>{t(item.label)}</Link>
              <div className="invisible absolute start-0 top-full z-30 min-w-52 translate-y-1 rounded-xl border border-line bg-white p-2 opacity-0 shadow-[0_12px_30px_#03223f18] transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
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
        <div className="flex shrink-0 items-center gap-5 max-n:gap-3 max-m:gap-2">
          <LanguageSwitch className="text-navy max-m:hidden" />
          {user ? (
            <>
              {unread > 0 && (
                <Link href="/messages" className="grid size-6 place-items-center rounded-full bg-gold text-[10px] font-bold text-dark no-underline" aria-label={t('{count} unread messages', { count: unread })}>
                  {unread}
                </Link>
              )}
              <ButtonLink href={accountHref} size="md" className={accountButton}>
                {t(user.role === 'admin' ? 'Admin' : 'Dashboard')} <span className="max-m:hidden"><Arrow /></span>
              </ButtonLink>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold leading-[18px] text-navy no-underline max-m:hidden">{t('Login')}</Link>
              <ButtonLink href="/register" size="md" className={accountButton}>
                <span className="max-m:hidden">{t('Register now')}</span><span className="m:hidden">{t('Register')}</span> <span className="max-m:hidden"><Arrow /></span>
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={t(open ? 'Close navigation' : 'Open navigation')}
            className="hidden size-10 cursor-pointer place-items-center rounded-full text-[20px] text-navy transition-colors hover:bg-cream max-n:grid"
          >
            {open ? <FaXmark aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" aria-label={t('Mobile navigation')} className="relative z-20 border-b border-[#e9e9e5] bg-white px-4 pb-5 pt-2 shadow-[0_14px_30px_#03223f14] n:hidden">
          <ul className="grid">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-[#f0ece2] last:border-0">
                <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-between px-1 text-[15px] font-medium capitalize text-navy no-underline hover:text-[#90691f]">
                  {t(item.label)} <FaArrowRight aria-hidden="true" className="text-[11px] text-[#c9b48a] rtl:-scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3">
            <span className="text-[13px] font-semibold text-navy">{t('Language')}</span>
            <LanguageSwitch className="text-navy" />
          </div>
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-full border border-navy text-sm font-semibold text-navy no-underline">{t('Login')}</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white no-underline hover:text-white">{t('Register now')}</Link>
            </div>
          )}
        </nav>
      )}
    </>
  );
}
