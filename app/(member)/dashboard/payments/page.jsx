import { FaCircleCheck, FaClock, FaLock, FaWallet } from 'react-icons/fa6';
import { PaymentList } from '@/components/member/PaymentBits';
import { Card, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { formatDate } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { memberPaymentState } from '@/lib/payments.js';

const plain = (requests) => requests.map((request) => ({ ...request, amount: Number(request.amount).toLocaleString('en-PK') }));

export default async function PaymentStatus() {
  const user = await requireUser('/dashboard/payments');
  const [t, lang] = [await getT(), await getLang()];
  const { access, state, requests, pending } = await memberPaymentState(user.id);
  const active = state === 'active';
  const view = active
    ? { icon: FaCircleCheck, color: 'text-[var(--d-green,#1f8a3a)]', title: 'Your access is active', text: access.expires_at ? t('Your access runs until {date}.', { date: formatDate(access.expires_at, lang) }) : t('Your access does not expire.') }
    : pending
      ? { icon: FaClock, color: 'text-[var(--d-gold,#946c13)]', title: 'Your payment is being reviewed', text: t('Our team will check it shortly. You do not need to pay again.') }
      : state === 'expired'
        ? { icon: FaLock, color: 'text-[var(--d-red,#a33a2c)]', title: 'Your access has expired', text: t('Submit a new payment to continue.') }
        : { icon: FaLock, color: 'text-muted', title: 'You do not have full access yet', text: t('Make a payment to unlock complete profiles.') };
  return (
    <div className="mx-auto grid max-w-[820px] gap-6">
      <PageHeader title="My Payment Status" text="Your full profile access and payments." />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className={`mt-0.5 text-2xl ${view.color}`}><view.icon aria-hidden="true" /></span>
            <div>
              <h2 className="text-lg font-semibold text-navy">{t(view.title)}</h2>
              <p className="mt-0.5 text-[13px] text-muted">{view.text}</p>
            </div>
          </div>
          {!active && !pending && <ButtonLink tone="gold" size="md" href="/dashboard/payments/submit"><FaWallet aria-hidden="true" /> {t('View Payment Options')}</ButtonLink>}
        </div>
      </Card>
      {requests.length > 0 && <Card title="Recent payments"><PaymentList requests={plain(requests.slice(0, 5))} /></Card>}
    </div>
  );
}
