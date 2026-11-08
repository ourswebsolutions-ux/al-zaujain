import Link from 'next/link';
import { notFound } from 'next/navigation';
import { consultantApprove, consultantReject, createProposal, messageClient } from '@/app/actions/consultant';
import { RejectForm } from '@/components/admin/RejectForm';
import { ActionButton, Badge, Panel, Title } from '@/components/admin/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireConsultant } from '@/lib/auth.js';
import { chatEnabled } from '@/lib/chat.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { compatibleProfiles } from '@/lib/matching.js';
import { profileSections } from '@/lib/profile-schema.js';
import { getProfile } from '@/lib/profiles.js';
import { getT } from '@/lib/i18n/server.js';

export default async function AssignedProfile({ params }) {
  const t = await getT();
  const { consultant } = await requireConsultant();
  const profile = await getProfile(idFromCode((await params).code));
  if (!profile || profile.consultant_id !== consultant.id) notFound();
  const code = profileCode(profile.id);
  const sections = profileSections(profile).map((section) => (consultant.perm_contact ? section : { ...section, rows: section.rows.filter((row) => !row.name.startsWith('contact_')) }));
  const matches = consultant.perm_proposals && profile.status === 'approved' ? await compatibleProfiles(profile, 6) : [];
  return (
    <>
      <Link href="/consultant/profiles" className="text-xs text-navy">{t('← Assigned profiles')}</Link>
      <Title actions={consultant.perm_edit ? <ButtonLink size="sm" tone="outline" href={`/consultant/profiles/${code}/edit`}>{t('Edit')}</ButtonLink> : null}>{profile.full_name} · {code}</Title>
      <Panel>
        <div className="mb-3 flex gap-2"><Badge value={profile.status} /><Badge value={profile.verification_status} /></div>
        <div className="flex flex-wrap items-center gap-3">
          {consultant.perm_review && profile.status !== 'approved' && <ActionButton action={consultantApprove} fields={{ id: profile.id }}>{t('Approve')}</ActionButton>}
          {consultant.perm_review && profile.status !== 'rejected' && <RejectForm action={consultantReject} id={profile.id} />}
          {consultant.perm_chat && profile.user_id && (await chatEnabled()) && <ActionButton action={messageClient} fields={{ id: profile.id }} tone="gold">{t('Message client')}</ActionButton>}
        </div>
      </Panel>
      {matches.length > 0 && (
        <Panel title={t('Suggest a matching proposal')}>
          <ul className="grid gap-2 text-[13px]">
            {matches.map((match) => (
              <li key={match.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--d-line,#eee6d8)] pb-2">
                <span><Link href={`/profile/${match.code}`} className="font-semibold text-navy">{match.code}</Link> {match.name}, {match.age} · {match.city} · <strong>{match.score}%</strong></span>
                <ActionButton action={createProposal} fields={{ id: profile.id, other_id: idFromCode(match.code) }} tone="outline">{t('Suggest')}</ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {sections.map((section) => (
        <Panel key={section.key} title={section.title}>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-3 max-p:grid-cols-2 max-m:grid-cols-1">
            {section.rows.map((row) => (
              <div key={row.name}>
                <dt className="text-[10px] font-semibold uppercase tracking-[.6px] text-muted">{row.label}</dt>
                <dd className="whitespace-pre-line text-[13px] text-navy">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ))}
    </>
  );
}
