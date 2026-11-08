import { FaEye } from 'react-icons/fa6';
import { Badge, FilterForm, Identity, IconLink, SearchField, Table, TablePager, Title } from '@/components/admin/Ui';
import { filterSelect } from '@/components/admin/styles';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { accessState } from '@/lib/payments.js';

const SIZE = 15;

export default async function PaidUsers({ searchParams }) {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const { q = '', access = '', page: rawPage } = await searchParams;
  const now = new Date();
  const running = { active: true, OR: [{ expires_at: null }, { expires_at: { gt: now } }] };
  const where = { role: 'user' };
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
  if (access === 'paid') where.member_access = { is: running };
  if (access === 'unpaid') where.NOT = { member_access: { is: running } };
  const db = getDb();
  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pages);
  const rows = await db.user.findMany({ where, include: { member_access: true, _count: { select: { payment_requests: true } } }, orderBy: { id: 'desc' }, take: SIZE, skip: (page - 1) * SIZE });
  return (
    <>
      <Title text="See who has paid, and open a user to grant, extend or revoke access.">{t('Paid Users')}</Title>
      <Table
        head={['User', 'Access', 'Expires', 'Payments', '']}
        empty={rows.length === 0 ? 'No users found.' : null}
        toolbar={(
          <FilterForm clearHref="/admin/paid-users" active={!!(q || access)}>
            <SearchField value={q} placeholder="Search name or email" />
            <select name="access" defaultValue={access} aria-label={t('Access')} className={filterSelect}>
              <option value="">{t('All users')}</option><option value="paid">{t('Paid')}</option><option value="unpaid">{t('Unpaid')}</option>
            </select>
          </FilterForm>
        )}
        footer={<TablePager page={page} pages={pages} total={total} perPage={SIZE} path="/admin/paid-users" query={{ q, access }} />}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.name} sub={row.email} href={`/admin/users/${row.id}`} /></td>
            <td><Badge value={accessState(row.member_access)} /></td>
            <td className="whitespace-nowrap">{row.member_access?.expires_at ? formatDate(row.member_access.expires_at, lang) : row.member_access ? t('No expiry') : '—'}</td>
            <td>{row._count.payment_requests}</td>
            <td><IconLink href={`/admin/users/${row.id}`} label="View" icon={<FaEye aria-hidden="true" />} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
