import { FaReceipt } from 'react-icons/fa6';
import { PaymentList } from '@/components/member/PaymentBits';
import { Card, EmptyState, PageHeader } from '@/components/member/Ui';
import { requireUser } from '@/lib/auth.js';
import { memberPaymentState } from '@/lib/payments.js';

export default async function MemberPaymentHistory() {
  const user = await requireUser('/dashboard/payments/history');
  const { requests } = await memberPaymentState(user.id);
  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeader title="Payment History" text="Every payment you have submitted." />
      {requests.length > 0
        ? <Card><PaymentList requests={requests.map((request) => ({ ...request, amount: Number(request.amount).toLocaleString('en-PK') }))} /></Card>
        : <EmptyState icon={<FaReceipt aria-hidden="true" />} title="No payments yet" text="Your payments will appear here." />}
    </div>
  );
}
