'use client';

import { useState } from 'react';
import { FaCheck, FaCopy } from 'react-icons/fa6';
import { useLang, useT } from '@/components/i18n/LanguageProvider';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { formatDate } from '@/lib/format.js';

export function CopyRow({ label, value }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--d-line,#eef0f3)] py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{t(label)}</p>
        <p dir="ltr" className="break-all text-left font-mono text-[13.5px] font-medium text-navy">{value}</p>
      </div>
      <button type="button" onClick={copy} aria-label={t('Copy {label}', { label: t(label) })} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--d-hover,#f2f3f6)] px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-[var(--d-hover,#e7e9ee)]">
        {copied ? <FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> : <FaCopy aria-hidden="true" />} {t(copied ? 'Copied' : 'Copy')}
      </button>
    </div>
  );
}

const PILLS = { approved: 'bg-[#28a7451a] text-[var(--d-green,#1f8a3a)]', pending: 'bg-[#e4b6532b] text-[var(--d-gold,#946c13)]', rejected: 'bg-[#dc35451a] text-[var(--d-red,#c02e3c)]' };

export function PaymentList({ requests }) {
  const t = useT();
  const lang = useLang();
  return (
    <ul className="divide-y divide-[var(--d-line,#eef0f3)]">
      {requests.map((request) => (
        <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
          <span className="min-w-0">
            <span className="block font-semibold text-navy">{request.method_name} · {request.amount}</span>
            <span dir="ltr" className="block text-xs text-muted">{request.transaction_id}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-xs text-muted">{formatDate(request.created_at, lang)}</span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${PILLS[request.status]}`}>{t(PAYMENT_STATUS[request.status])}</span>
            <a href={`/api/payments/${request.id}/receipt`} target="_blank" rel="noopener" className="text-xs font-medium text-navy">{t('Receipt')}</a>
          </span>
        </li>
      ))}
    </ul>
  );
}
