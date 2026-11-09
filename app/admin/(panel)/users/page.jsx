import { FaBan, FaCircleCheck, FaEye, FaPeopleGroup, FaTrash, FaUserPlus, FaUserTie } from 'react-icons/fa6';
import { updateUser } from '@/app/actions/admin';
import { Badge, ConfirmDelete, FilterForm, Identity, IconLink, SearchField, Stat, Table, TablePager, Title } from '@/components/admin/Ui';
import { filterSelect } from '@/components/admin/styles';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

const SIZES = [10, 25, 50];

export default async function Users({ searchParams }) {
  const admin = await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const { q = '', role = '', status = '', page: rawPage, size: rawSize } = await searchParams;
  const size = SIZES.includes(Number(rawSize)) ? Number(rawSize) : 10;
  const where = {};
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }];
  if (['user', 'consultant', 'admin'].includes(role)) where.role = role;
  if (['active', 'suspended'].includes(status)) where.status = status;
  const db = getDb();
  const [total, members, consultants, suspended, all] = await Promise.all([
    db.user.count({ where }), db.user.count({ where: { role: 'user' } }), db.user.count({ where: { role: 'consultant' } }), db.user.count({ where: { status: 'suspended' } }), db.user.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pages);
  const rows = await db.user.findMany({
    where,
    include: { _count: { select: { profiles: true } }, consultant: { select: { photo: true } } },
    orderBy: { id: 'desc' },
    take: size,
    skip: (page - 1) * size,
  });

  return (
    <>
      <Title text="Add users and consultants, and manage every account." actions={<ButtonLink size="md" href="/admin/users/new"><FaUserPlus aria-hidden="true" /> {t('Add user')}</ButtonLink>}>{t('User management')}</Title>
      <div className="mb-6 grid grid-cols-4 gap-5 max-p:grid-cols-2 max-m:grid-cols-1">
        <Stat icon={<FaPeopleGroup aria-hidden="true" />} tone="navy" label="All accounts" value={all} href="/admin/users" />
        <Stat icon={<FaCircleCheck aria-hidden="true" />} tone="green" label="Members" value={members} href="/admin/users?role=user" />
        <Stat icon={<FaUserTie aria-hidden="true" />} tone="blue" label="Consultants" value={consultants} href="/admin/users?role=consultant" />
        <Stat icon={<FaBan aria-hidden="true" />} tone="red" label="Suspended" value={suspended} href="/admin/users?status=suspended" />
      </div>
      <Table
        head={['User', 'Role', 'Status', 'Profiles', 'Joined', 'Actions']}
        empty={rows.length === 0 ? 'No users found.' : null}
        toolbar={(
          <FilterForm clearHref="/admin/users" active={!!(q || role || status)}>
            <select name="size" defaultValue={size} aria-label={t('Rows per page')} className={filterSelect}>{SIZES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <SearchField value={q} placeholder="Search name, email or phone" />
            <select name="role" defaultValue={role} aria-label={t('Role')} className={filterSelect}>
              <option value="">{t('All roles')}</option><option value="user">{t('Member')}</option><option value="consultant">{t('Consultant')}</option><option value="admin">{t('Admin')}</option>
            </select>
            <select name="status" defaultValue={status} aria-label={t('Status')} className={filterSelect}>
              <option value="">{t('All statuses')}</option><option value="active">{t('Active')}</option><option value="suspended">{t('Suspended')}</option>
            </select>
          </FilterForm>
        )}
        footer={<TablePager page={page} pages={pages} total={total} perPage={size} path="/admin/users" query={{ q, role, status, size }} />}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.name} sub={row.email} src={row.consultant?.photo ? `/media/consultants/${row.consultant.photo}` : null} href={`/admin/users/${row.id}`} /></td>
            <td><Badge value={row.role} /></td>
            <td>
              <Badge value={row.status} />
              {row.chat_disabled && <span className="ms-1.5"><Badge value={t('Chat restricted')} /></span>}
            </td>
            <td>{row._count.profiles}</td>
            <td className="whitespace-nowrap">{formatDate(row.created_at, lang)}</td>
            <td>
              <div className="flex items-center gap-0.5">
                <IconLink href={`/admin/users/${row.id}`} label="View" icon={<FaEye aria-hidden="true" />} />
                {row.id !== admin.id && row.role !== 'admin' && <ConfirmDelete action={updateUser} fields={{ id: row.id, action: 'delete' }} icon={<FaTrash aria-hidden="true" />} label="Delete user" title={t('Delete {name}?', { name: row.name })} text="This permanently removes the account and all of its profiles. It cannot be undone." />}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
