import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MethodForm } from '@/components/admin/PaymentForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function EditMethod({ params }) {
  await requireAdmin();
  const t = await getT();
  const method = await getDb().paymentMethod.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!method) notFound();
  return (
    <div className="max-w-[760px]">
      <Link href="/admin/payment-methods" className="text-[13px] text-navy">← {t('Payment Methods')}</Link>
      <div className="mt-3"><Title>{method.name}</Title></div>
      <Panel><MethodForm method={method} /></Panel>
    </div>
  );
}
