import Link from 'next/link';
import { notFound } from 'next/navigation';
import { approveProfile, assignConsultant, rejectProfile, removeProfile, reviewVerification, setFeatured, setPublished } from '@/app/actions/admin';
import { ProfileTypeForm } from '@/components/admin/ProfileTypeForm';
import { TypeBadge } from '@/components/profile/TypeBadge';
import { RejectForm } from '@/components/admin/RejectForm';
import { ActionButton, Badge, Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button, ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { idFromCode, profileCode } from '@/lib/format.js';
import { profileSections } from '@/lib/profile-schema.js';
import { getProfile, profilePhotos } from '@/lib/profiles.js';
import { getT } from '@/lib/i18n/server.js';

export default async function AdminProfile({ params }) {
  const t = await getT();
  await requireAdmin();
  const { code } = await params;
  const profile = await getProfile(idFromCode(code));
  if (!profile) notFound();
  const db = getDb();
  const photos = await profilePhotos(profile.id);
  const consultants = await db.consultant.findMany({ select: { id: true, display_name: true }, orderBy: { display_name: 'asc' } });
  const document = await db.cnicDocument.findUnique({ where: { profile_id: profile.id } });
  const label = profileCode(profile.id);
  return (
    <>
      <Link href="/admin/profiles" className="text-xs text-navy">{t('← Profiles')}</Link>
      <Title actions={<ButtonLink size="sm" tone="outline" href={`/admin/profiles/${label}/edit`}>{t('Edit')}</ButtonLink>}>{profile.full_name} · {label}</Title>

      <Panel title={t('Review')}>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <Badge value={profile.status} /><Badge value={profile.verification_status} /><TypeBadge type={profile.access_type} />
          {profile.source === 'admin' && <span className="text-muted">{t('Added by the team')}</span>}
          <span className="text-muted">{profile.views} views</span>
          {profile.rejection_reason && <span className="text-[var(--d-red,#a33a2c)]">{profile.rejection_reason}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile.status !== 'approved' && profile.status !== 'hidden' && <ActionButton action={approveProfile} fields={{ id: profile.id }}>{t('Approve')}</ActionButton>}
          {profile.status === 'approved' && <ActionButton action={setPublished} fields={{ id: profile.id, publish: 0 }} tone="outline">{t('Unpublish')}</ActionButton>}
          {profile.status === 'hidden' && <ActionButton action={setPublished} fields={{ id: profile.id, publish: 1 }}>{t('Publish')}</ActionButton>}
          <ButtonLink size="sm" tone="outline" href={`/profile/${label}`} target="_blank">{t('Preview')}</ButtonLink>
          {profile.status !== 'rejected' && <RejectForm action={rejectProfile} id={profile.id} />}
          <ActionButton action={setFeatured} fields={{ id: profile.id, featured: profile.featured ? 0 : 1, sort: profile.featured_sort }} tone="outline">{t(profile.featured ? 'Remove from homepage' : 'Feature on homepage')}</ActionButton>
          <ActionButton action={removeProfile} fields={{ id: profile.id }} tone="danger">{t('Delete permanently')}</ActionButton>
        </div>
      </Panel>

      <Panel title={t('Profile type')}>
        <ProfileTypeForm id={profile.id} type={profile.access_type} />
      </Panel>

      {profile.extra_info && (
        <Panel title={t('Unassigned information')}>
          <p dir="auto" className="whitespace-pre-line text-[13px] leading-6 text-navy">{profile.extra_info}</p>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-6 max-p:grid-cols-1">
        <Panel title={t('Consultant')}>
          <form action={assignConsultant} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={profile.id} />
            <select name="consultant_id" defaultValue={profile.consultant_id ?? ''} aria-label={t('Assigned consultant')} className={inputSm}>
              <option value="">{t('Not assigned')}</option>
              {consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.display_name}</option>)}
            </select>
            <Button type="submit" size="sm" className="cursor-pointer">{t('Assign')}</Button>
          </form>
        </Panel>
        <Panel title={t('CNIC verification')}>
          {document ? (
            <>
              <div className="mb-3 flex gap-3 text-xs">
                <a href={`/api/admin/cnic/${profile.id}/front`} target="_blank" rel="noopener" className="font-semibold text-navy underline">{t('Open front')}</a>
                {document.back_file && <a href={`/api/admin/cnic/${profile.id}/back`} target="_blank" rel="noopener" className="font-semibold text-navy underline">{t('Open back')}</a>}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton action={reviewVerification} fields={{ id: profile.id, decision: 'verified' }}>{t('Mark verified')}</ActionButton>
                <form action={reviewVerification} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={profile.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <input name="note" aria-label={t('Reason')} placeholder={t('Reason')} className={`${inputSm} w-44`} />
                  <Button type="submit" tone="danger" size="sm" className="cursor-pointer">{t('Reject')}</Button>
                </form>
              </div>
            </>
          ) : <p className="text-xs text-muted">{t('No CNIC submitted, so this profile cannot be verified.')}</p>}
        </Panel>
      </div>

      {photos.length > 0 && (
        <Panel title={t('Photos')}>
          <div className="flex flex-wrap gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos.map((photo) => <img key={photo.id} src={`/media/photos/${photo.thumb}`} alt="" className="size-28 rounded-lg object-cover" />)}
          </div>
        </Panel>
      )}

      {profileSections(profile).map((section) => (
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
