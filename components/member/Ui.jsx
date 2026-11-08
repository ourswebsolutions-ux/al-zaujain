'use client';

import Link from 'next/link';
import { useT } from '@/components/i18n/LanguageProvider';

export const cardClass = 'rounded-2xl border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_1px_2px_#03223f0a,0_10px_28px_#03223f08]';

export function Card({ title, action, className = '', children }) {
  const t = useT();
  return (
    <section className={`${cardClass} min-w-0 p-6 max-m:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-semibold tracking-[-0.1px] text-navy">{t(title)}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, text, action }) {
  const t = useT();
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.5px] text-navy max-m:text-[22px]">{t(title)}</h1>
        {text && <p className="mt-1 max-w-[640px] text-[13px] leading-[22px] text-muted">{t(text)}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }) {
  const t = useT();
  return (
    <div className={`${cardClass} grid place-items-center px-6 py-14 text-center`}>
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-cream text-xl text-[var(--d-gold,#a67b2e)]">{icon}</span>
      <h2 className="text-[17px] font-semibold text-navy">{t(title)}</h2>
      <p className="mt-1 max-w-[400px] text-[13px] leading-[22px] text-muted">{t(text)}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatTile({ icon, label, value, note, href }) {
  const t = useT();
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{t(label)}</p>
        <span className="text-sm text-[var(--d-gold,#a67b2e)]">{icon}</span>
      </div>
      <p className="mt-2 font-nunito text-[32px] font-extrabold leading-none text-navy">{value}</p>
      <p className="mt-2 text-[11px] text-muted">{note}</p>
    </>
  );
  return <Link href={href} className={`${cardClass} block p-5 no-underline transition duration-200 hover:-translate-y-0.5 hover:border-[var(--d-line,#dcc9a0)]`}>{body}</Link>;
}
