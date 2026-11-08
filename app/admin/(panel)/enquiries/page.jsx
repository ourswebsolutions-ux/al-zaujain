import { toggleEnquiry } from '@/app/actions/admin';
import { ActionButton, Identity, Table, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Enquiries() {
  const t = await getT();
  const lang = await getLang();
  await requireAdmin();
  const rows = await getDb().enquiry.findMany({ orderBy: [{ handled: 'asc' }, { id: 'desc' }], take: 200 });
  return (
    <>
      <Title>{t('Enquiries')}</Title>
      <Table head={['From', 'For', 'Message', 'Received', '']} empty={rows.length === 0 ? 'No enquiries yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.name} sub={[row.phone, row.city].filter(Boolean).join(' · ')} /></td>
            <td>{row.profile_for}</td>
            <td className="max-w-80 whitespace-pre-line">{row.message}</td>
            <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
            <td><ActionButton action={toggleEnquiry} fields={{ id: row.id }} tone="outline">{t(row.handled ? 'Reopen' : 'Mark handled')}</ActionButton></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
