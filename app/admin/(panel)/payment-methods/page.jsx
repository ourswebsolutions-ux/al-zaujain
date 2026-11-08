import { FaPen, FaTrash } from 'react-icons/fa6';
import { deleteMethod, toggleMethod } from '@/app/actions/payments';
import { ActionButton, Badge, ConfirmDelete, Identity, IconLink, Table, Title } from '@/components/admin/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function PaymentMethods() {
  await requireAdmin();
  const t = await getT();
  const rows = await getDb().paymentMethod.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] });
  return (
    <>
      <Title text="Add every bank or service you accept. Only active ones are shown to users." actions={<ButtonLink size="md" href="/admin/payment-methods/new">{t('Add payment method')}</ButtonLink>}>{t('Payment Methods')}</Title>
      <Table head={['Method', 'Account holder', 'IBAN / account', 'Status', 'Actions']} empty={rows.length === 0 ? 'No payment methods yet. Add your first one.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.name} sub={row.bank_name} src={row.qr_image && row.active ? `/media/payments/${row.qr_image}` : null} href={`/admin/payment-methods/${row.id}`} /></td>
            <td>{row.account_holder}</td>
            <td dir="ltr" className="text-left text-[12.5px]">{row.iban && <span className="block">{row.iban}</span>}{row.account_number}</td>
            <td><Badge value={row.active ? 'active' : 'inactive'} /></td>
            <td>
              <div className="flex items-center gap-1">
                <ActionButton action={toggleMethod} fields={{ id: row.id }} tone="outline">{t(row.active ? 'Turn off' : 'Turn on')}</ActionButton>
                <IconLink href={`/admin/payment-methods/${row.id}`} label="Edit" icon={<FaPen aria-hidden="true" />} />
                <ConfirmDelete action={deleteMethod} fields={{ id: row.id }} icon={<FaTrash aria-hidden="true" />} label="Delete" title={t('Delete {name}?', { name: row.name })} text="Past payment records are kept. Users will no longer see this method." />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
