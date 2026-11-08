import { PaymentTable } from '@/components/admin/PaymentTable';
import { Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function PaymentHistory({ searchParams }) {
  await requireAdmin();
  const t = await getT();
  return (
    <>
      <Title text="Every payment that has been reviewed.">{t('Payment History')}</Title>
      <PaymentTable path="/admin/payment-history" statuses={['approved', 'rejected']} query={await searchParams} />
    </>
  );
}
