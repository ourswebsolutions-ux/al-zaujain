import { Table, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Activity() {
  const t = await getT();
  const lang = await getLang();
  await requireAdmin();
  const rows = await getDb().activityLog.findMany({ include: { actor: { select: { name: true } } }, orderBy: { id: 'desc' }, take: 300 });
  return (
    <>
      <Title>{t('Activity log')}</Title>
      <Table head={['When', 'Who', 'Action', 'Target']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
            <td>{row.actor?.name ?? 'Visitor'}</td>
            <td>{row.action.replaceAll('_', ' ')}</td>
            <td>{row.target}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
