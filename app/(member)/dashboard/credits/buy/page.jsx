import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaClock, FaCoins, FaStar, FaWallet } from 'react-icons/fa6';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { PaymentSubmit } from '@/components/member/PaymentSubmit';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { activePackages, packageView, unlockCost } from '@/lib/credits.js';
import { getT } from '@/lib/i18n/server.js';
import { activePaymentMethods, memberPaymentState } from '@/lib/payments.js';

export const metadata = { title: 'Buy Premium Credits' };

// Same look as the dashboard cards (components/member/Ui.jsx); kept here because this is a server page.
const cardClass = 'rounded-2xl border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_1px_2px_#03223f0a,0_10px_28px_#03223f08]';

export default async function BuyCredits({ searchParams }) {
  const user = await requireUser('/dashboard/credits/buy');
  const t = await getT();
  const { package: chosen } = await searchParams;
  const [packages, cost, { pendingCredits }] = await Promise.all([activePackages(), unlockCost(), memberPaymentState(user.id)]);
  const header = <PageHeader title="Buy Premium Credits" text={t('Choose a package. Unlocking one Premium profile uses {cost} of your credits. Credits are added after our team confirms your payment.', { cost })} action={<ButtonLink tone="outline" size="md" href="/dashboard/credits">{t('My credits')}</ButtonLink>} />;
  if (user.role !== 'user') return <>{header}<EmptyState icon={<FaCoins aria-hidden="true" />} title="Staff accounts do not need credits" text="Administrators and consultants can already open every profile." /></>;
  if (pendingCredits) return <>{header}<EmptyState icon={<FaClock aria-hidden="true" />} title="Your credit purchase is being reviewed" text="Our team will check it shortly. The credits are added as soon as it is approved." action={<ButtonLink tone="outline" href="/dashboard/credits">{t('My credits')}</ButtonLink>} /></>;
  if (packages.length === 0) return <>{header}<EmptyState icon={<FaCoins aria-hidden="true" />} title="No packages are available yet" text="Please check back soon, or contact our team on WhatsApp." /></>;

  const pack = packages.find((item) => String(item.id) === String(chosen));
  if (pack) {
    const methods = await activePaymentMethods();
    if (methods.length === 0) return <>{header}<EmptyState icon={<FaWallet aria-hidden="true" />} title="Payment options are not available yet" text="Please contact our team." /></>;
    return (
      <>
        {header}
        <Link href="/dashboard/credits/buy" className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-navy no-underline"><FaArrowLeft aria-hidden="true" className="rtl:-scale-x-100" /> {t('Choose another package')}</Link>
        <PaymentSubmit methods={methods.map(({ created_at, ...method }) => method)} pack={packageView(pack)} />
      </>
    );
  }

  return (
    <>
      {header}
      <ul className="grid grid-cols-4 gap-5 max-[1280px]:grid-cols-3 max-p:grid-cols-2 max-m:grid-cols-1">
        {packages.map(packageView).map((item) => (
          <li key={item.id} className={`${cardClass} relative flex flex-col p-6 ${item.featured ? 'border-gold! ring-2 ring-gold/30' : ''}`}>
            {item.featured && <span className="absolute -top-3 start-5 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f4d889,#c99432)] px-3 py-1 text-[11px] font-bold text-dark"><FaStar aria-hidden="true" /> {t('Most popular')}</span>}
            <h2 className="text-lg font-semibold text-navy">{item.name}</h2>
            <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--d-gold,#9b712b)]">{t(item.kind === 'boost' ? (item.superBoost ? 'Super Boost' : 'Boost my Proposal') : item.scope === 'foreign' ? 'International (Foreign + Pakistan)' : 'Local (Pakistan)')}</p>
            {item.kind === 'boost'
              ? <p className="mt-3 font-nunito text-[40px] font-extrabold leading-none text-navy">{item.days}<span className="ms-1.5 text-sm font-semibold text-muted">{t('days')}</span></p>
              : <p className="mt-3 font-nunito text-[40px] font-extrabold leading-none text-navy">{item.credits}<span className="ms-1.5 text-sm font-semibold text-muted">{t(item.credits === 1 ? 'profile' : 'profiles')}</span></p>}
            {item.wasPrice > 0 && <p className="mt-2 text-sm text-muted"><s>Rs {item.wasPrice.toLocaleString('en-PK')}</s> <span className="ms-1 rounded bg-[#c0392b] px-1.5 py-0.5 text-[11px] font-bold text-white">{item.discount}% {t('OFF')}</span></p>}
            <p className={`${item.wasPrice > 0 ? 'mt-1' : 'mt-2'} text-xl font-bold text-[var(--d-gold,#9b712b)]`}>Rs {Number(item.price).toLocaleString('en-PK')}</p>
            {item.credits > 0 && <p className="text-xs text-muted">{t('Rs {price} per profile', { price: Math.round(Number(item.price) / Math.max(1, Math.floor(item.credits / cost))).toLocaleString('en-PK') })}</p>}
            {item.description && <p className="mt-3 text-[13px] leading-6 text-muted">{item.description}</p>}
            {item.kind === 'boost' ? (
              <ul className="mt-4 grid gap-1.5 text-[13px] text-navy">
                <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Your proposal at the top of search results')}</li>
                <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Needs a complete profile with a visible photo')}</li>
              </ul>
            ) : (
            <ul className="mt-4 grid gap-1.5 text-[13px] text-navy">
              <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Unlock {count} Premium profiles', { count: Math.floor(item.credits / cost) })}</li>
              <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Real photos and contact details')}</li>
              <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Unlocked profiles stay open')}</li>
              {item.scope === 'foreign' && <li className="flex items-center gap-2"><FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" /> {t('Overseas profiles included')}</li>}
            </ul>
            )}
            <div className="mt-auto pt-5"><ButtonLink tone={item.featured ? 'gold' : 'navy'} href={`/dashboard/credits/buy?package=${item.id}`} className="w-full">{t('Choose {name}', { name: item.name })}</ButtonLink></div>
          </li>
        ))}
      </ul>
    </>
  );
}
