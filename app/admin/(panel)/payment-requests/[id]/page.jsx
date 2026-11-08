import Link from 'next/link';
import { notFound } from 'next/navigation';
import { reviewPayment } from '@/app/actions/payments';
import { Badge, Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Submit } from '@/components/ui/Form';
import { requireAdmin } from '@/lib/auth.js';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { accessState, defaultAccessDays } from '@/lib/payments.js';

function Detail({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[13px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-navy">{children}</dd>
    </div>
  );
}

export default async function PaymentRequestDetail({ params }) {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const id = Number((await params).id) || 0;
  const payment = await getDb().paymentRequest.findUnique({ where: { id }, include: { user: { include: { member_access: true } }, reviewer: { select: { name: true } } } });
  if (!payment) notFound();
  const pending = payment.status === 'pending';
  return (
    <>
      <Link href="/admin/payment-requests" className="text-[13px] text-navy">← {t('Payment Requests')}</Link>
      <div className="mt-3"><Title actions={<Badge value={payment.status} label={PAYMENT_STATUS[payment.status]} />}>{t('Payment #{id}', { id: payment.id })}</Title></div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-6 max-p:grid-cols-1">
        <div className="min-w-0">
          <Panel title="Payment details">
            <dl className="divide-y divide-[var(--d-line,#eef0f3)]">
              <Detail label={t('Method')}>{payment.method_name}</Detail>
              <Detail label={t('Sender name')}>{payment.sender_name}</Detail>
              <Detail label={t('Transaction ID')}><span dir="ltr" className="font-mono">{payment.transaction_id}</span></Detail>
              <Detail label={t('Amount paid')}>{Number(payment.amount).toLocaleString('en-PK')}</Detail>
              <Detail label={t('Submitted')}>{formatDateTime(payment.created_at, lang)}</Detail>
              {payment.reviewed_at && <Detail label={t('Reviewed')}>{payment.reviewer?.name} · {formatDateTime(payment.reviewed_at, lang)}</Detail>}
            </dl>
          </Panel>
          <Panel title="User">
            <dl className="divide-y divide-[var(--d-line,#eef0f3)]">
              <Detail label={t('Name')}><Link href={`/admin/users/${payment.user.id}`} className="text-navy">{payment.user.name}</Link></Detail>
              <Detail label={t('Email')}><span dir="ltr">{payment.user.email}</span></Detail>
              <Detail label={t('Phone')}><span dir="ltr">{payment.user.phone ?? '—'}</span></Detail>
              <Detail label={t('Access')}><Badge value={accessState(payment.user.member_access)} /></Detail>
            </dl>
          </Panel>
          <Panel title={pending ? 'Your decision' : 'Internal note'}>
            <form action={reviewPayment} className="grid gap-3">
              <input type="hidden" name="id" value={payment.id} />
              <textarea name="admin_note" rows={3} maxLength={500} defaultValue={payment.admin_note ?? ''} placeholder={t('Internal note, not shown to the user')} aria-label={t('Internal note')} className={`${inputSm} w-full`} />
              {pending ? (
                <>
                  <label className="text-[13px] text-muted">{t('Access length in days')} <input name="days" type="number" min="0" max="3650" defaultValue={await defaultAccessDays()} className={`${inputSm} ml-2 w-24`} /></label>
                  <div className="flex flex-wrap gap-2">
                    <Submit name="decision" value="approve" className="cursor-pointer">{t('Approve payment')}</Submit>
                    <Submit name="decision" value="reject" tone="danger" className="cursor-pointer">{t('Reject payment')}</Submit>
                  </div>
                </>
              ) : <Submit name="decision" value="note" tone="outline" size="sm" className="w-fit cursor-pointer">{t('Save note')}</Submit>}
            </form>
          </Panel>
        </div>
        <Panel title="Receipt" className="min-w-0">
          <a href={`/api/payments/${payment.id}/receipt`} target="_blank" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/payments/${payment.id}/receipt`} alt={t('Payment receipt')} className="max-h-[640px] w-full rounded-lg border border-[var(--d-line,#eef0f3)] object-contain" />
          </a>
        </Panel>
      </div>
    </>
  );
}
