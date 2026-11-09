import { FaEye } from 'react-icons/fa6';
import { Badge, FilterForm, Identity, IconLink, SearchField, Table, TablePager } from './Ui';
import { filterSelect } from './styles';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

const SIZE = 15;

// Shared by Payment Requests and Payment History, which differ only in the statuses shown.
export async function PaymentTable({ path, statuses, query }) {
  const [t, lang] = [await getT(), await getLang()];
  const { q = '', status = '', page: rawPage } = query;
  const where = { status: { in: statuses.includes(status) ? [status] : statuses } };
  if (q) where.OR = [{ transaction_id: { contains: q } }, { sender_name: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }];
  const db = getDb();
  const total = await db.paymentRequest.count({ where });
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pages);
  const rows = await db.paymentRequest.findMany({ where, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: [{ status: 'asc' }, { id: 'desc' }], take: SIZE, skip: (page - 1) * SIZE });
  return (
    <Table
      head={['User', 'Method', 'Transaction ID', 'Amount', 'Status', 'Date', '']}
      empty={rows.length === 0 ? 'No payments found.' : null}
      toolbar={(
        <FilterForm clearHref={path} active={!!(q || status)}>
          <SearchField value={q} placeholder="Search name, email or transaction ID" />
          {statuses.length > 1 && (
            <select name="status" defaultValue={status} aria-label={t('Status')} className={filterSelect}>
              <option value="">{t('All statuses')}</option>
              {statuses.map((value) => <option key={value} value={value}>{t(PAYMENT_STATUS[value])}</option>)}
            </select>
          )}
        </FilterForm>
      )}
      footer={<TablePager page={page} pages={pages} total={total} perPage={SIZE} path={path} query={{ q, status }} />}
    >
      {rows.map((row) => (
        <tr key={row.id}>
          <td><Identity name={row.user.name} sub={row.user.email} href={`/admin/users/${row.user.id}`} /></td>
          <td>{row.method_name}</td>
          <td dir="ltr" className="text-start font-mono text-[12.5px]">{row.transaction_id}</td>
          <td className="whitespace-nowrap">{Number(row.amount).toLocaleString('en-PK')}</td>
          <td><Badge value={row.status} label={PAYMENT_STATUS[row.status]} /></td>
          <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
          <td><IconLink href={`/admin/payment-requests/${row.id}`} label="View" icon={<FaEye aria-hidden="true" />} /></td>
        </tr>
      ))}
    </Table>
  );
}
