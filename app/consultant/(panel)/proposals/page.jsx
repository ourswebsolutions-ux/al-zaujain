import Link from 'next/link';
import { updateProposal } from '@/app/actions/consultant';
import { Badge, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireConsultant } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Proposals() {
  const t = await getT();
  const lang = await getLang();
  const { consultant } = await requireConsultant();
  const rows = await getDb().matchProposal.findMany({
    where: { consultant_id: consultant.id },
    include: { profile_a: { select: { display_name: true } }, profile_b: { select: { display_name: true } } },
    orderBy: { id: 'desc' },
  });
  return (
    <>
      <Title>{t('Matching proposals')}</Title>
      <Table head={['Pair', 'Status', 'Created', 'Update']} empty={rows.length === 0 ? 'Open an assigned profile to suggest a proposal.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <Link href={`/profile/${profileCode(row.profile_a_id)}`} className="font-semibold text-navy">{row.profile_a.display_name}</Link> and{' '}
              <Link href={`/profile/${profileCode(row.profile_b_id)}`} className="font-semibold text-navy">{row.profile_b.display_name}</Link>
            </td>
            <td><Badge value={row.status} /></td>
            <td className="whitespace-nowrap">{formatDate(row.created_at, lang)}</td>
            <td>
              <form action={updateProposal} className="flex gap-2">
                <input type="hidden" name="id" value={row.id} />
                <select name="status" defaultValue={row.status} aria-label={t('Status')} className={inputSm}>
                  {['suggested', 'shared', 'accepted', 'declined'].map((status) => <option key={status}>{status}</option>)}
                </select>
                <Button type="submit" size="sm" tone="outline" className="cursor-pointer">{t('Save')}</Button>
              </form>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
