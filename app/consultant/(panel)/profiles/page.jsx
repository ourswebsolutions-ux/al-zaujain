import Link from 'next/link';
import { Badge, Table, Title } from '@/components/admin/Ui';
import { requireConsultant } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { ageFromDob, profileCode } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';

export default async function AssignedProfiles() {
  const t = await getT();
  const { consultant } = await requireConsultant();
  const rows = await getDb().profile.findMany({
    where: { consultant_id: consultant.id },
    select: { id: true, full_name: true, date_of_birth: true, city: true, status: true, verification_status: true },
    orderBy: [{ status: 'asc' }, { id: 'desc' }],
  });
  return (
    <>
      <Title>{t('Assigned profiles')}</Title>
      <Table head={['Code', 'Name', 'City', 'Status', 'Verification']} empty={rows.length === 0 ? 'No profiles are assigned to you yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Link href={`/consultant/profiles/${profileCode(row.id)}`} className="font-semibold text-navy">{profileCode(row.id)}</Link></td>
            <td>{row.full_name}, {ageFromDob(row.date_of_birth)}</td>
            <td>{row.city}</td>
            <td><Badge value={row.status} /></td>
            <td><Badge value={row.verification_status} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
