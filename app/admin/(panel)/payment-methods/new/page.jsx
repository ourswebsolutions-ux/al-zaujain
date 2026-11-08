import Link from 'next/link';
import { MethodForm } from '@/components/admin/PaymentForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export default async function NewMethod() {
  await requireAdmin();
  const t = await getT();
  return (
    <div className="max-w-[760px]">
      <Link href="/admin/payment-methods" className="text-[13px] text-navy">← {t('Payment Methods')}</Link>
      <div className="mt-3"><Title>{t('Add payment method')}</Title></div>
      <Panel><MethodForm /></Panel>
    </div>
  );
}
