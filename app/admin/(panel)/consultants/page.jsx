import { Badge, Identity, Table, Title } from '@/components/admin/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Consultants() {
  const t = await getT();
  await requireAdmin();
  const rows = await getDb().consultant.findMany({
    include: { user: { select: { email: true, status: true } }, _count: { select: { profiles: true } } },
    orderBy: { display_name: 'asc' },
  });
  return (
    <>
      <Title actions={<ButtonLink size="md" href="/admin/users/new">{t('Add consultant')}</ButtonLink>}>{t('Consultants')}</Title>
      <Table head={['Consultant', 'City', 'Assigned', 'Shown to', 'Status']} empty={rows.length === 0 ? 'No consultants yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.display_name} sub={row.user.email} src={row.photo ? `/media/consultants/${row.photo}` : null} href={`/admin/consultants/${row.id}`} /></td>
            <td>{t(row.city)}</td>
            <td>{row._count.profiles}</td>
            <td>{row.audience === 'team' ? t('Consultant team only') : row.audience === 'city' ? t('{city} only', { city: t(row.audience_city) }) : t('Everyone')}</td>
            <td><Badge value={row.user.status} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
