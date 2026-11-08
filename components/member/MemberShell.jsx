'use client';

import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { DARK_THEME, KEEP_LIGHT } from '@/lib/theme.js';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowUpRightFromSquare, FaBars, FaBell, FaComments, FaEye, FaGaugeHigh, FaGear, FaHeart, FaHeartCircleCheck, FaIdCard, FaMagnifyingGlass, FaMoneyBillTransfer, FaReceipt, FaUnlock, FaWallet, FaPenToSquare, FaRightFromBracket, FaSliders, FaXmark } from 'react-icons/fa6';
import { NotificationList } from './NotificationList';
import { logout } from '@/app/actions/auth';
import { readAllNotifications } from '@/app/actions/member';
import { useT } from '@/components/i18n/LanguageProvider';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';

const MEMBER_NAV = [
  { group: 'My profile', items: [
    { href: '/dashboard', label: 'Overview', icon: FaGaugeHigh },
    { href: '/dashboard/profile', label: 'My Matrimonial Profile', icon: FaIdCard },
    { href: '/dashboard/edit', label: 'Edit Profile', icon: FaPenToSquare },
    { href: '/dashboard/preferences', label: 'Partner Preferences', icon: FaSliders },
  ] },
  { group: 'Connections', items: [
    { href: '/dashboard/matches', label: 'Recommended Matches', icon: FaHeartCircleCheck },
    { href: '/dashboard/saved', label: 'Saved Profiles', icon: FaHeart },
    { href: '/dashboard/views', label: 'Profile Views', icon: FaEye },
    { href: '/messages', label: 'Messages', icon: FaComments, badge: 'messages' },
  ] },
  { group: 'Payments', items: [
    { href: '/dashboard/payments', label: 'My Payment Status', icon: FaWallet },
    { href: '/dashboard/payments/submit', label: 'Submit Payment', icon: FaMoneyBillTransfer },
    { href: '/dashboard/payments/history', label: 'Payment History', icon: FaReceipt },
    { href: '/dashboard/payments/unlocked', label: 'Unlocked Profile Access', icon: FaUnlock },
  ] },
  { group: 'Account', items: [
    { href: '/dashboard/notifications', label: 'Notifications', icon: FaBell, badge: 'notifications' },
    { href: '/dashboard/settings', label: 'Account Settings', icon: FaGear },
  ] },
];

const staffNav = (home) => [{ group: 'Account', items: [
  { href: home, label: 'Back to my dashboard', icon: FaGaugeHigh },
  { href: '/messages', label: 'Messages', icon: FaComments, badge: 'messages' },
] }];

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Overview', icon: FaGaugeHigh },
  { href: '/dashboard/matches', label: 'Matches', icon: FaHeartCircleCheck },
  { href: '/messages', label: 'Messages', icon: FaComments, badge: 'messages' },
  { href: '/dashboard/profile', label: 'Profile', icon: FaIdCard },
];

function isActive(href, pathname) {
  const editing = pathname === '/dashboard/edit' || (pathname.startsWith('/dashboard/profiles/') && pathname.endsWith('/edit'));
  if (href === '/dashboard/edit') return editing;
  if (href === '/dashboard' || href === '/dashboard/payments') return pathname === href;
  if (href === '/dashboard/profile') return !editing && pathname.startsWith('/dashboard/profile');
  return pathname.startsWith(href);
}

function Badge({ count, className = '' }) {
  if (!count) return null;
  return <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-soft px-1 text-[10px] font-bold text-dark ${className}`}>{count > 99 ? '99+' : count}</span>;
}

function Sidebar({ groups, counts, pathname, onNavigate, user }) {
  const t = useT();
  return (
    <div className={`${KEEP_LIGHT} flex h-full flex-col bg-dark text-white`}>
      <Link href="/" className="flex items-center gap-3 px-6 pb-5 pt-6 text-white no-underline">
        <Image src="/images/logo.png" alt="Al Zaujain" width={42} height={42} className="rounded-full bg-white" />
        <span className="text-sm font-bold leading-tight tracking-[1px]">AL ZAUJAIN<small className="mt-0.5 block text-[8.5px] font-medium tracking-[.4px] text-champagne">{t('International Consultancy')}</small></span>
      </Link>
      <nav aria-label={t('Dashboard')} className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.group} className="mt-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[1.6px] text-[#8fa3b5]">{t(group.group)}</p>
            {group.items.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] no-underline transition-colors duration-150 ${active ? 'font-medium text-white' : 'text-[#c7d3dd] hover:bg-white/5 hover:text-white'}`}>
                  {active && <motion.span layoutId="active-nav" transition={{ type: 'spring', stiffness: 420, damping: 36 }} className="absolute inset-0 rounded-lg border-l-2 border-gold-soft bg-white/10" />}
                  <item.icon aria-hidden="true" className={`relative text-sm ${active ? 'text-gold-soft' : ''}`} />
                  <span className="relative flex-1">{t(item.label)}</span>
                  <Badge count={counts[item.badge]} className="relative" />
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#c7d3dd] no-underline hover:bg-white/5 hover:text-white"><FaArrowUpRightFromSquare aria-hidden="true" className="text-xs" /> {t('Visit website')}</Link>
        <form action={logout}>
          <button type="submit" className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-[#c7d3dd] hover:bg-white/5 hover:text-white"><FaRightFromBracket aria-hidden="true" className="text-xs" /> {t('Sign out')}</button>
        </form>
        <p dir="ltr" className="mt-1 truncate px-3 text-[11px] text-[#8fa3b5]">{user.email}</p>
      </div>
    </div>
  );
}

function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => { if (!ref.current?.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

const panel = 'absolute right-0 top-full z-40 mt-2 rounded-2xl border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_18px_48px_#03223f26]';
const motionProps = { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.15 } };

function NotificationMenu({ count, recent, setCount }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={count ? t('Notifications, {count} unread', { count }) : t('Notifications')} className="relative grid size-10 cursor-pointer place-items-center rounded-full text-[15px] text-navy transition-colors hover:bg-[var(--d-hover,#f2f3f6)]">
        <FaBell aria-hidden="true" />
        <Badge count={count} className="absolute -right-0.5 -top-0.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...motionProps} className={`${panel} w-[min(380px,calc(100vw-24px))] p-4 max-m:fixed max-m:left-3 max-m:right-3 max-m:top-16 max-m:mt-0 max-m:w-auto`}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">{t('Notifications')}</h2>
              {count > 0 && <button type="button" onClick={() => { setCount(0); readAllNotifications(); }} className="cursor-pointer text-[11px] font-semibold text-[var(--d-gold,#9b712b)]">{t('Mark all as read')}</button>}
            </div>
            {recent.length > 0 ? <NotificationList items={recent} onNavigate={() => setOpen(false)} /> : <p className="py-8 text-center text-[13px] text-muted">{t('You’re all caught up.')}</p>}
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="mt-1 block rounded-lg bg-[var(--d-hover,#f7f8fa)] py-2 text-center text-xs font-semibold text-navy no-underline hover:bg-[var(--d-hover,#eef0f3)]">{t('View all notifications')}</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu({ user, avatar }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const link = 'block rounded-lg px-3 py-2 text-[13px] text-navy no-underline hover:bg-[var(--d-hover,#f7f8fa)]';
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t('Account menu')} className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-[var(--d-hover,#f2f3f6)] max-m:pr-1">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/photos/${avatar}`} alt="" className="size-8 rounded-full object-cover" />
        ) : <span className="grid size-8 place-items-center rounded-full bg-navy text-xs font-semibold text-champagne">{user.name[0]?.toUpperCase()}</span>}
        <span className="max-w-[120px] truncate text-[13px] font-medium text-navy max-m:hidden">{user.name}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...motionProps} className={`${panel} w-52 p-2`}>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} className={link}>{t('My profile')}</Link>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={link}>{t('Account settings')}</Link>
            <Link href="/" onClick={() => setOpen(false)} className={link}>{t('Visit website')}</Link>
            <form action={logout}><button type="submit" className={`${link} w-full cursor-pointer text-left text-[var(--d-red,#a33a2c)]`}>{t('Sign out')}</button></form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const POLL_MS = 30000;

export function MemberShell({ user, avatar, unreadMessages, unreadAlerts, recent, theme: initialTheme = 'light', children }) {
  const t = useT();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const [messages, setMessages] = useState(unreadMessages);
  const [alerts, setAlerts] = useState(unreadAlerts);
  const groups = user.role === 'user' ? MEMBER_NAV : staffNav(user.role === 'admin' ? '/admin' : '/consultant');
  const counts = { messages, notifications: alerts };
  const title = groups.flatMap((group) => group.items).find((item) => isActive(item.href, pathname))?.label ?? 'Dashboard';

  useEffect(() => { setMessages(unreadMessages); setAlerts(unreadAlerts); }, [unreadMessages, unreadAlerts]);

  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      const response = await fetch('/api/chat/unread').catch(() => null);
      if (!response?.ok) return;
      const data = await response.json();
      setMessages(data.unread);
      setAlerts(data.notifications);
    };
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-dvh bg-[var(--d-bg,#f4f5f8)] text-ink ${theme === 'dark' ? DARK_THEME : ''}`}>
      <aside className="fixed inset-y-0 left-0 z-30 w-[264px] max-b:hidden">
        <Sidebar groups={groups} counts={counts} pathname={pathname} user={user} />
      </aside>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.button type="button" aria-label={t('Close menu')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-dark/50 b:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.22 }} className="fixed inset-y-0 left-0 z-50 w-[272px] b:hidden">
              <Sidebar groups={groups} counts={counts} pathname={pathname} user={user} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="b:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-[var(--d-line,#e7e9ee)] bg-white/90 px-7 backdrop-blur max-m:h-[60px] max-m:px-3">
          <button type="button" onClick={() => setDrawer(true)} aria-label={t('Open menu')} className="grid size-10 cursor-pointer place-items-center rounded-full text-navy hover:bg-[var(--d-hover,#f2f3f6)] b:hidden"><FaBars aria-hidden="true" /></button>
          <p className="truncate text-[15px] font-semibold text-navy">{t(title)}</p>
          <form action="/proposals" role="search" className="ml-auto flex items-center gap-2 rounded-full border border-[var(--d-line,#e7e9ee)] bg-[var(--d-hover,#f7f8fa)] px-3.5 focus-within:border-gold max-p:hidden">
            <FaMagnifyingGlass aria-hidden="true" className="text-xs text-muted" />
            <input name="q" type="search" aria-label={t('Search proposals')} placeholder={t('Search proposals')} maxLength={80} className="w-52 bg-transparent py-2 text-[13px] text-navy focus:outline-none" />
          </form>
          <div className="flex items-center gap-1 max-p:ml-auto">
            <LanguageSwitch className="me-2 text-navy max-m:me-0" />
            <Link href="/messages" aria-label={messages ? t('Messages, {count} unread', { count: messages }) : t('Messages')} className="relative grid size-10 place-items-center rounded-full text-[15px] text-navy transition-colors hover:bg-[var(--d-hover,#f2f3f6)]">
              <FaComments aria-hidden="true" />
              <Badge count={messages} className="absolute -right-0.5 -top-0.5" />
            </Link>
            <ThemeToggle theme={theme} onChange={setTheme} className="text-navy hover:bg-[var(--d-hover,#f2f3f6)]" />
            <NotificationMenu count={alerts} recent={recent} setCount={setAlerts} />
            <AccountMenu user={user} avatar={avatar} />
          </div>
        </header>

        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="mx-auto max-w-[1280px] p-7 max-b:pb-24 max-m:p-4 max-m:pb-24">
          {children}
        </motion.main>
      </div>

      {user.role === 'user' && (
        <nav aria-label={t('Quick navigation')} className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[var(--d-line,#e7e9ee)] bg-white pb-[env(safe-area-inset-bottom)] b:hidden">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium no-underline ${active ? 'text-navy' : 'text-muted'}`}>
                <span className="relative text-base"><item.icon aria-hidden="true" className={active ? 'text-[var(--d-gold,#a67b2e)]' : ''} /><Badge count={counts[item.badge]} className="absolute -right-3 -top-2" /></span>
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
