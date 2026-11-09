import Link from 'next/link';
import { FaCartShopping, FaCircleCheck, FaClock, FaCoins, FaLockOpen, FaReceipt } from 'react-icons/fa6';
import { Card, EmptyState, PageHeader, StatTile } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { requireUser } from '@/lib/auth.js';
import { creditSummary, unlockCost } from '@/lib/credits.js';
import { formatDate, formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Premium Credits' };

const KIND = { purchase: 'Credits purchased', unlock: 'Profile unlocked', adjustment: 'Adjusted by Al Zaujain', refund: 'Credits refunded' };
const PILLS = { approved: 'bg-[#28a7451a] text-[var(--d-green,#1f8a3a)]', pending: 'bg-[#e4b6532b] text-[var(--d-gold,#946c13)]', rejected: 'bg-[#dc35451a] text-[var(--d-red,#c02e3c)]' };

export default async function CreditsPage({ searchParams }) {
  const user = await requireUser('/dashboard/credits');
  const [t, lang] = [await getT(), await getLang()];
  const { submitted } = await searchParams;
  const [summary, cost] = await Promise.all([creditSummary(user.id), unlockCost()]);
  const pending = summary.purchases.find((row) => row.status === 'pending');
  const buy = <ButtonLink tone="gold" size="md" href="/dashboard/credits/buy"><FaCartShopping aria-hidden="true" /> {t('Buy Premium Credits')}</ButtonLink>;
  return (
    <div className="grid gap-6">
      <PageHeader title="Premium Credits" text={t('Credits unlock Premium profiles: their real photo and contact details. Each unlock uses {cost} of your credits and stays open for you. Free profiles never use credits.', { cost })} action={buy} />
      {(submitted === '1' || pending) && (
        <p className="flex items-center gap-2 rounded-xl bg-[var(--d-gold-bg,#fcf4e1)] px-4 py-3 text-[13px] font-medium text-[var(--d-gold,#806126)]">
          <FaClock aria-hidden="true" /> {t('Your payment for {name} is waiting for review. The credits are added as soon as our team approves it.', { name: pending?.package_name ?? t('your package') })}
        </p>
      )}
      <div className="grid grid-cols-4 gap-4 max-p:grid-cols-2">
        <StatTile icon={<FaCoins aria-hidden="true" />} label="Available credits" value={summary.balance} note={t('Ready to use')} href="/dashboard/credits" />
        <StatTile icon={<FaCartShopping aria-hidden="true" />} label="Total purchased" value={summary.purchased} note={t('Across all packages')} href="/dashboard/credits" />
        <StatTile icon={<FaLockOpen aria-hidden="true" />} label="Total used" value={summary.used} note={t('On profile unlocks')} href="/dashboard/credits" />
        <StatTile icon={<FaCircleCheck aria-hidden="true" />} label="Unlocked profiles" value={summary.unlocks.length} note={t('Open for you, always')} href="/dashboard/credits" />
      </div>

      <Card title="Unlocked profiles">
        {summary.unlocks.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted">{t('Profiles you unlock appear here, so you can open them again at no cost.')}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 max-p:grid-cols-2 max-m:grid-cols-1">
            {summary.unlocks.map((row) => (
              <li key={row.id}>
                <Link href={`/profile/${row.code}`} className="flex items-center gap-3 rounded-xl border border-[var(--d-line,#eef0f3)] p-3 no-underline transition-colors hover:border-[var(--d-line,#dcc9a0)]">
                  {row.photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`/media/photos/${row.photo}`} alt="" className="size-12 rounded-full object-cover" />
                    : <span className="grid size-12 place-items-center rounded-full bg-cream text-[var(--d-gold,#a67b2e)]"><FaLockOpen aria-hidden="true" /></span>}
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-navy">{row.name} · {row.code}</span>
                    <span className="block text-xs text-muted">{t(row.city)} · {formatDate(row.at, lang)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 items-start gap-6 max-p:grid-cols-1">
        <Card title="Purchase history">
          {summary.purchases.length === 0 ? (
            <EmptyState icon={<FaReceipt aria-hidden="true" />} title="No purchases yet" text="Buy a package to start unlocking Premium profiles." action={buy} />
          ) : (
            <ul className="divide-y divide-[var(--d-line,#eef0f3)]">
              {summary.purchases.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{row.package_name} · {t('{count} credits', { count: row.credits })}</span>
                    <span className="block text-xs text-muted">Rs {Number(row.amount).toLocaleString('en-PK')} · {formatDate(row.created_at, lang)}</span>
                  </span>
                  <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${PILLS[row.status]}`}>{t(PAYMENT_STATUS[row.status])}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Credit history">
          {summary.transactions.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">{t('No credit activity yet.')}</p>
          ) : (
            <ul className="divide-y divide-[var(--d-line,#eef0f3)]">
              {summary.transactions.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-navy">{t(KIND[row.kind])}{row.kind === 'unlock' && row.reference ? ` · ${row.reference}` : ''}</span>
                    <span className="block truncate text-xs text-muted">{formatDateTime(row.created_at, lang)}{row.kind === 'adjustment' && row.note ? ` · ${row.note}` : ''}</span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span dir="ltr" className={`block font-semibold ${row.amount > 0 ? 'text-[var(--d-green,#1f8a3a)]' : 'text-[var(--d-red,#a33a2c)]'}`}>{row.amount > 0 ? `+${row.amount}` : row.amount}</span>
                    <span className="block text-[11px] text-muted">{t('Balance {count}', { count: row.balance_after })}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
