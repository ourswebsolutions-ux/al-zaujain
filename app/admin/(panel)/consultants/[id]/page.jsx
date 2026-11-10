import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteConsultant, saveConsultant } from '@/app/actions/admin';
import { ConsultantForm } from '@/components/admin/ConsultantForm';
import { ActionButton, Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { citiesWithCountry } from '@/lib/places.js';
import { getDb } from '@/lib/db.js';
import { profileCode } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';

export default async function EditConsultant({ params }) {
  const t = await getT();
  await requireAdmin();
  const db = getDb();
  const consultant = await db.consultant.findUnique({ where: { id: Number((await params).id) } });
  if (!consultant) notFound();
  const assigned = await db.profile.findMany({ where: { consultant_id: consultant.id }, select: { id: true, full_name: true }, orderBy: { id: 'desc' } });
  return (
    <div className="max-w-[760px]">
      <Title actions={<ActionButton action={deleteConsultant} fields={{ id: consultant.id }} tone="danger">{t('Delete consultant')}</ActionButton>}>{consultant.display_name}</Title>
      <Panel><ConsultantForm action={saveConsultant} consultant={consultant} cities={(await citiesWithCountry()).map((city) => city.name)} /></Panel>
      <Panel title={`Assigned profiles (${assigned.length})`}>
        <p className="mb-2 text-xs text-muted">{t('Assign profiles from each profile’s page.')}</p>
        <ul className="grid gap-1 text-[13px]">
          {assigned.map((profile) => <li key={profile.id}><Link href={`/admin/profiles/${profileCode(profile.id)}`} className="text-navy">{profileCode(profile.id)} · {profile.full_name}</Link></li>)}
        </ul>
      </Panel>
    </div>
  );
}
