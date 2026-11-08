import { FaCircleCheck, FaClock, FaWallet } from 'react-icons/fa6';
import { PaymentSubmit } from '@/components/member/PaymentSubmit';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';
import { activePaymentMethods, memberPaymentState } from '@/lib/payments.js';
import { getSetting } from '@/lib/settings.js';

export default async function SubmitPayment() {
  const user = await requireUser('/dashboard/payments/submit');
  const t = await getT();
  const { state, pending } = await memberPaymentState(user.id);
  const header = <PageHeader title="Submit Payment" text="Choose a payment method, send your payment, then tell us about it here." />;
  const back = <ButtonLink tone="outline" size="md" href="/dashboard/payments">{t('My Payment Status')}</ButtonLink>;
  if (state === 'active') return <>{header}<EmptyState icon={<FaCircleCheck aria-hidden="true" />} title="Your access is active" text="You do not need to pay again." action={back} /></>;
  if (pending) return <>{header}<EmptyState icon={<FaClock aria-hidden="true" />} title="Your payment is being reviewed" text="Our team will check it shortly. You do not need to pay again." action={back} /></>;
  const methods = await activePaymentMethods();
  if (methods.length === 0) return <>{header}<EmptyState icon={<FaWallet aria-hidden="true" />} title="Payment options are not available yet" text="Please contact our team." /></>;
  return <>{header}<PaymentSubmit methods={methods.map(({ created_at, ...method }) => method)} price={await getSetting('access_price')} /></>;
}
