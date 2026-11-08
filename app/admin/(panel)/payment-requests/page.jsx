import { PaymentTable } from '@/components/admin/PaymentTable';
import { Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function PaymentRequests({ searchParams }) {
  await requireAdmin();
  const t = await getT();
  return (
    <>
      <Title text="Check each receipt, then approve or reject. Nothing unlocks until you approve it.">{t('Payment Requests')}</Title>
      <PaymentTable path="/admin/payment-requests" statuses={['pending', 'approved', 'rejected']} query={await searchParams} />
    </>
  );
}
