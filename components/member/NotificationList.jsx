'use client';

import Link from 'next/link';
import { FaBell, FaCircleCheck, FaComments, FaHeart, FaIdCard, FaUserTie, FaWallet } from 'react-icons/fa6';
import { readNotification } from '@/app/actions/member';
import { useLang, useT } from '@/components/i18n/LanguageProvider';
import { formatDateTime } from '@/lib/format.js';

const ICONS = { message: FaComments, match: FaHeart, verification: FaCircleCheck, profile: FaIdCard, consultant: FaUserTie, payment: FaWallet };

export function NotificationList({ items, onNavigate }) {
  const t = useT();
  const lang = useLang();
  return (
    <ul className="divide-y divide-[var(--d-line,#eef0f3)]">
      {items.map((item) => {
        const Icon = ICONS[item.type] ?? FaBell;
        const body = (
          <>
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[13px] ${item.read_at ? 'bg-[var(--d-hover,#f2f3f6)] text-muted' : 'bg-cream text-[var(--d-gold,#a67b2e)]'}`}><Icon aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] leading-5 text-navy ${item.read_at ? '' : 'font-semibold'}`}>{t(item.title)}</span>
              {item.body && <span className="block truncate text-xs leading-5 text-muted">{t(item.body)}</span>}
              <time className="text-[11px] text-muted">{formatDateTime(item.created_at, lang)}</time>
            </span>
            {!item.read_at && <span aria-label={t('Unread')} className="mt-2 size-2 shrink-0 rounded-full bg-gold" />}
          </>
        );
        const classes = 'flex items-start gap-3 px-1 py-3 no-underline';
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={`${classes} rounded-lg transition-colors hover:bg-[var(--d-hover,#f7f8fa)]`} onClick={() => { onNavigate?.(); if (!item.read_at) readNotification(item.id); }}>{body}</Link>
            ) : <div className={classes}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
