'use client';

import { filterSelect, inputSm } from './styles';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaMagnifyingGlass, FaTriangleExclamation } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { Button } from '@/components/ui/Button';
import { Submit } from '@/components/ui/Form';

const surface = 'rounded-xl bg-white shadow-[0_4px_24px_#03223f0f]';

export function Title({ children, actions, text }) {
  const t = useT();
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.3px] text-navy">{children}</h1>
        {text && <p className="mt-0.5 text-[13px] text-muted">{t(text)}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({ title, children, className = '' }) {
  const t = useT();
  return (
    <section className={`${surface} mb-6 p-6 max-m:p-4 ${className}`}>
      {title && <h2 className="mb-4 text-[15px] font-semibold text-navy">{t(title)}</h2>}
      {children}
    </section>
  );
}

// The table sits in a card with an optional toolbar above and pagination below.
export function Table({ head, children, empty, toolbar, footer }) {
  const t = useT();
  return (
    <div className={`${surface} overflow-hidden`}>
      {toolbar && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--d-line,#eef0f3)] p-4">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-start text-[13.5px] text-[var(--d-text,#47566a)]">
          <thead className="bg-[var(--d-hover,#f6f7fb)] text-[11.5px] font-semibold uppercase tracking-[.6px] text-[var(--d-text,#5d6b80)]">
            <tr>{head.map((label, index) => <th key={index} scope="col" className="whitespace-nowrap px-5 py-3.5 font-semibold">{t(label)}</th>)}</tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-[var(--d-line,#eef0f3)] [&_td]:px-5 [&_td]:py-3.5 [&_td]:align-middle [&_tr]:transition-colors [&_tr:hover]:bg-[var(--d-hover,#f9fafc)]">{children}</tbody>
        </table>
      </div>
      {empty && <p className="p-10 text-center text-sm text-muted">{t(empty)}</p>}
      {footer}
    </div>
  );
}

export function TablePager({ page, pages, total, perPage, path, query }) {
  const t = useT();
  const buildHref = (number) => `${path}?${new URLSearchParams({ ...query, page: number })}`;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])].filter((value) => value >= 1 && value <= pages);
  const box = 'grid size-8 place-items-center rounded-md text-[13px] font-medium no-underline transition-colors';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--d-line,#eef0f3)] px-5 py-3.5 text-[13px] text-muted">
      <span>{t('Showing {from} to {to} of {total} entries', { from, to, total })}</span>
      <nav aria-label={t('Pagination')} className="flex items-center gap-1">
        {page > 1 && <Link href={buildHref(page - 1)} aria-label={t('Previous')} className={`${box} bg-[var(--d-hover,#f2f3f6)] text-navy hover:bg-[var(--d-hover,#e7e9ee)]`}><FaChevronLeft aria-hidden="true" className="rtl:-scale-x-100 text-[10px]" /></Link>}
        {numbers.map((number) => <Link key={number} href={buildHref(number)} aria-current={number === page ? 'page' : undefined} className={`${box} ${number === page ? 'bg-navy text-white shadow-[0_2px_6px_#062b4e55]' : 'bg-[var(--d-hover,#f2f3f6)] text-navy hover:bg-[var(--d-hover,#e7e9ee)]'}`}>{number}</Link>)}
        {page < pages && <Link href={buildHref(page + 1)} aria-label={t('Next')} className={`${box} bg-[var(--d-hover,#f2f3f6)] text-navy hover:bg-[var(--d-hover,#e7e9ee)]`}><FaChevronRight aria-hidden="true" className="rtl:-scale-x-100 text-[10px]" /></Link>}
      </nav>
    </div>
  );
}

// Filters apply as soon as they change, so nobody has to find a button. Typing waits for a pause.
export function FilterForm({ children, clearHref, active }) {
  const t = useT();
  const timer = useRef(null);
  const submit = (form) => form.requestSubmit();
  return (
    <form
      className="flex w-full flex-wrap items-center gap-2.5"
      onChange={(event) => {
        clearTimeout(timer.current);
        const { form, type } = event.target;
        timer.current = setTimeout(() => submit(form), type === 'search' ? 500 : 0);
      }}
    >
      {children}
      {active && <Link href={clearHref} className="text-[13px] font-medium text-[var(--d-gold,#9b712b)] no-underline">{t('Clear filters')}</Link>}
    </form>
  );
}

export function SearchField({ name = 'q', value, placeholder }) {
  const t = useT();
  return (
    <label className="flex min-w-56 items-center gap-2 rounded-md border border-[var(--d-line,#dfe2e8)] bg-white px-3 focus-within:border-navy">
      <FaMagnifyingGlass aria-hidden="true" className="text-xs text-muted" />
      <input name={name} type="search" defaultValue={value} aria-label={t(placeholder)} placeholder={t(placeholder)} className="w-full bg-transparent py-2 text-[13px] text-navy focus:outline-none" />
    </label>
  );
}


const PILLS = {
  green: 'bg-[#28a7451a] text-[var(--d-green,#1f8a3a)]', blue: 'bg-[#1d9bf01a] text-[var(--d-blue,#127fc7)]', amber: 'bg-[#e4b6532b] text-[var(--d-gold,#946c13)]', red: 'bg-[#dc35451a] text-[var(--d-red,#c02e3c)]', grey: 'bg-[#66717d1a] text-[var(--d-text,#55606c)]', navy: 'bg-[var(--d-tint-strong,#062b4e14)] text-navy',
};
const BADGES = {
  approved: 'green', verified: 'blue', active: 'green', sent: 'green', accepted: 'green', user: 'grey', consultant: 'blue', admin: 'navy',
  pending: 'amber', suggested: 'amber', shared: 'blue', skipped: 'grey', not_submitted: 'grey', off: 'grey',
  rejected: 'red', suspended: 'red', failed: 'red', declined: 'red', expired: 'amber', revoked: 'red', none: 'grey', inactive: 'grey', hidden: 'grey',
};

const LABELS = { user: 'Member', not_submitted: 'No CNIC yet', pending: 'Waiting', approved: 'Live', off: 'Off', none: 'Unpaid', expired: 'Expired', revoked: 'Revoked', inactive: 'Inactive', hidden: 'Unpublished' };

export function Badge({ value, label }) {
  const t = useT();
  return <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium capitalize ${PILLS[BADGES[value] ?? 'grey']}`}>{t(label ?? LABELS[value] ?? String(value).replace('_', ' '))}</span>;
}

const AVATARS = ['bg-[var(--d-tint-strong,#062b4e1a)] text-navy', 'bg-[#e4b6532b] text-[var(--d-gold,#946c13)]', 'bg-[#28a7451a] text-[var(--d-green,#1f8a3a)]', 'bg-[#1d9bf01a] text-[var(--d-blue,#127fc7)]', 'bg-[#dc35451a] text-[var(--d-red,#c02e3c)]'];

export function Avatar({ name = '?', src, size = 'size-[38px] text-[13px]' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return <span className={`${size} grid shrink-0 place-items-center rounded-full font-semibold ${AVATARS[name.length % AVATARS.length]}`}>{initials}</span>;
}

// Avatar with a primary and secondary line, the first cell of most tables.
export function Identity({ name, sub, src, href }) {
  const body = (
    <>
      <Avatar name={name} src={src} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-navy">{name}</span>
        {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
      </span>
    </>
  );
  return href ? <Link href={href} className="flex items-center gap-3 no-underline hover:[&_span_span:first-child]:text-[var(--d-gold,#9b712b)]">{body}</Link> : <span className="flex items-center gap-3">{body}</span>;
}

export function Stat({ label, value, href, icon, tone = 'navy' }) {
  const t = useT();
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{t(label)}</p>
        <p className="mt-1 text-[26px] font-semibold leading-tight text-navy">{value}</p>
      </div>
      {icon && <span className={`grid size-11 shrink-0 place-items-center rounded-lg text-lg ${PILLS[tone]}`}>{icon}</span>}
    </>
  );
  const className = `${surface} flex items-center justify-between gap-3 p-5 no-underline transition-transform duration-200 hover:-translate-y-0.5`;
  return href ? <Link href={href} className={className}>{body}</Link> : <div className={className}>{body}</div>;
}

// Shows that something is happening, and prevents a second click.
export function ActionButton({ action, fields = {}, tone = 'navy', children }) {
  return (
    <form action={action} className="inline-block">
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <Submit tone={tone} size="sm" className="cursor-pointer">{children}</Submit>
    </form>
  );
}

const iconBtn = 'grid size-8 cursor-pointer place-items-center rounded-md text-[13px] no-underline transition-colors';

export function IconLink({ href, label, icon }) {
  const t = useT();
  return <Link href={href} aria-label={t(label)} title={t(label)} className={`${iconBtn} text-[var(--d-text,#5d6b80)] hover:bg-[var(--d-hover,#f2f3f6)] hover:text-navy`}>{icon}</Link>;
}

// Deleting always passes through this dialog.
export function ConfirmDelete({ action, fields = {}, title, text, label = 'Delete', icon, children }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      {icon ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={t(label)} title={t(label)} className={`${iconBtn} text-[var(--d-red,#c02e3c)] hover:bg-[#dc35451a]`}>{icon}</button>
      ) : <Button type="button" tone="danger" size="sm" onClick={() => setOpen(true)} className="cursor-pointer">{children ?? t(label)}</Button>}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-dark/50 p-4" onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label={t(title)} initial={{ y: 12, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8 }} transition={{ duration: 0.18 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[420px] rounded-xl bg-white p-7 text-center shadow-[0_24px_60px_#03223f40]">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#dc35451a] text-xl text-[var(--d-red,#c02e3c)]"><FaTriangleExclamation aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-semibold text-navy">{t(title)}</h2>
              <p className="mt-1.5 text-[13px] leading-6 text-muted">{t(text)}</p>
              <form action={action} className="mt-6 flex justify-center gap-3">
                {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
                <Button type="button" tone="outline" size="md" onClick={() => setOpen(false)} className="cursor-pointer">{t('Cancel')}</Button>
                <Submit tone="danger" size="md" className="cursor-pointer">{t('Yes, delete')}</Submit>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// An on/off switch that still posts as a normal checkbox.
export function Switch({ name, defaultChecked, label, text }) {
  const t = useT();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{t(label)}</span>
        {text && <span className="mt-0.5 block text-xs leading-5 text-muted">{t(text)}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-[var(--d-hover,#cfd5de)] transition-colors duration-200 after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_#03223f40] after:transition-transform after:duration-200 after:content-[''] peer-checked:bg-[#1f8a3a] peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy" />
    </label>
  );
}

export { filterSelect, inputSm };
