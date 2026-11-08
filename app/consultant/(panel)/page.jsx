import { Stat, Title } from '@/components/admin/Ui';
import { requireConsultant } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function ConsultantHome() {
  const t = await getT();
  const { consultant } = await requireConsultant();
  const db = getDb();
  const [assigned, pending, proposals, accepted] = await Promise.all([
    db.profile.count({ where: { consultant_id: consultant.id } }),
    db.profile.count({ where: { consultant_id: consultant.id, status: 'pending' } }),
    db.matchProposal.count({ where: { consultant_id: consultant.id } }),
    db.matchProposal.count({ where: { consultant_id: consultant.id, status: 'accepted' } }),
  ]);
  return (
    <>
      <Title>Assalam-o-Alaikum, {consultant.display_name}</Title>
      <div className="grid grid-cols-4 gap-px border border-line bg-line max-p:grid-cols-2">
        <Stat label={t('Assigned profiles')} value={assigned} href="/consultant/profiles" />
        <Stat label={t('Awaiting review')} value={pending} href="/consultant/profiles" />
        <Stat label={t('Proposals')} value={proposals} href="/consultant/proposals" />
        <Stat label={t('Accepted')} value={accepted} href="/consultant/proposals" />
      </div>
    </>
  );
}
