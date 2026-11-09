import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaBan, FaComments, FaEye, FaHeart, FaIdCard, FaPen, FaTrash } from 'react-icons/fa6';
import { removeProfile, updateUser } from '@/app/actions/admin';
import { adminGrantAccess, adminRevokeAccess, adminSetExpiry } from '@/app/actions/payments';
import { ActionButton, Avatar, Badge, ConfirmDelete, IconLink, Panel, Stat, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Submit } from '@/components/ui/Form';
import { EditUserForm, PasswordForm } from '@/components/admin/UserForms';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate, formatDateTime, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { accessState, defaultAccessDays } from '@/lib/payments.js';
import { profileSections } from '@/lib/profile-schema.js';
import { flattenProfile } from '@/lib/profiles.js';

function Detail({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[13px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-end font-medium text-navy">{children}</dd>
    </div>
  );
}

export default async function UserDetail({ params }) {
  const admin = await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const id = Number((await params).id);
  const db = getDb();
  const user = id ? await db.user.findUnique({
    where: { id },
    include: {
      consultant: true,
      member_access: true,
      payment_requests: { orderBy: { id: 'desc' }, take: 20 },
      profiles: { include: { country: { select: { name: true } }, photos: { select: { thumb: true }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], take: 1 } }, orderBy: { updated_at: 'desc' } },
      _count: { select: { messages: true, saved_profiles: true, profile_views: true } },
    },
  }) : null;
  if (!user) notFound();
  const profiles = user.profiles.map(flattenProfile);
  const state = accessState(user.member_access);
  const days = await defaultAccessDays();
  const self = user.id === admin.id;
  const canDelete = !self && user.role !== 'admin';
  const received = profiles.reduce((sum, profile) => sum + profile.views, 0);
  const assigned = user.consultant ? await db.profile.count({ where: { consultant_id: user.consultant.id } }) : 0;

  return (
    <>
      <Link href="/admin/users" className="text-[13px] text-navy">← {t('User management')}</Link>

      <section className="mb-6 mt-3 flex flex-wrap items-center gap-5 rounded-xl bg-white p-6 shadow-[0_4px_24px_#03223f0f]">
        <Avatar name={user.name} src={user.consultant?.photo ? `/media/consultants/${user.consultant.photo}` : profiles[0]?.photos[0] ? `/media/photos/${profiles[0].photos[0].thumb}` : null} size="size-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.3px] text-navy">{user.name}</h1>
          <p dir="ltr" className="text-[13px] text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5"><Badge value={user.role} /><Badge value={user.status} />{user.chat_disabled && <Badge value={t('Chat restricted')} />}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton action={updateUser} fields={{ id: user.id, action: 'chat' }} tone="outline">{t(user.chat_disabled ? 'Allow chat' : 'Restrict chat')}</ActionButton>
          {!self && <ActionButton action={updateUser} fields={{ id: user.id, action: 'status' }} tone="outline">{t(user.status === 'active' ? 'Suspend' : 'Reactivate')}</ActionButton>}
          {canDelete && <ConfirmDelete action={updateUser} fields={{ id: user.id, action: 'delete' }} label="Delete user" title={t('Delete {name}?', { name: user.name })} text="This permanently removes the account and all of its profiles. It cannot be undone." />}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-4 gap-5 max-p:grid-cols-2 max-m:grid-cols-1">
        <Stat icon={<FaIdCard aria-hidden="true" />} tone="navy" label="Profiles" value={profiles.length} />
        <Stat icon={<FaEye aria-hidden="true" />} tone="blue" label="Profile views" value={received} />
        <Stat icon={<FaComments aria-hidden="true" />} tone="green" label="Messages sent" value={user._count.messages} />
        <Stat icon={<FaHeart aria-hidden="true" />} tone="amber" label="Saved profiles" value={user._count.saved_profiles} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-6 max-p:grid-cols-1">
        <Panel title="Account details">
          <dl className="divide-y divide-[var(--d-line,#eef0f3)]">
            <Detail label={t('Name')}>{user.name}</Detail>
            <Detail label={t('Email')}><span dir="ltr">{user.email}</span></Detail>
            <Detail label={t('Phone')}><span dir="ltr">{user.phone ?? '—'}</span></Detail>
            <Detail label={t('Role')}><Badge value={user.role} /></Detail>
            <Detail label={t('Joined')}>{formatDate(user.created_at, lang)}</Detail>
            <Detail label={t('Last login')}>{user.last_login_at ? formatDateTime(user.last_login_at, lang) : t('Never')}</Detail>
            <Detail label={t('Match emails')}>{t(user.match_emails ? user.match_frequency : 'off')}</Detail>
            <Detail label={t('Profiles viewed')}>{user._count.profile_views}</Detail>
            {user.consultant && <Detail label={t('Assigned profiles')}>{assigned}</Detail>}
          </dl>
          {user.consultant && <div className="mt-4"><ButtonLink tone="outline" size="sm" href={`/admin/consultants/${user.consultant.id}`}>{t('Manage consultant details')}</ButtonLink></div>}
        </Panel>
        <div className="min-w-0">
          <Panel title="Edit details"><EditUserForm user={user} /></Panel>
          <Panel title="Reset password"><PasswordForm id={user.id} /></Panel>
        </div>
      </div>

      {user.role === 'user' && (
        <Panel title="Full profile access">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px]">
            <Badge value={state} />
            <span className="text-muted">{user.member_access?.expires_at ? t('Expires {date}', { date: formatDate(user.member_access.expires_at, lang) }) : user.member_access ? t('No expiry') : t('No access yet')}</span>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <form action={adminGrantAccess} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="user_id" value={user.id} />
              <label className="text-[13px] text-muted">{t('Days')} <input name="days" type="number" min="0" max="3650" defaultValue={days} className={`${inputSm} ms-1 w-20`} /></label>
              <Submit size="sm" className="cursor-pointer">{t(state === 'active' ? 'Extend access' : 'Grant access')}</Submit>
            </form>
            <form action={adminSetExpiry} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="user_id" value={user.id} />
              <label className="text-[13px] text-muted">{t('End date')} <input name="expires_at" type="date" defaultValue={user.member_access?.expires_at ? user.member_access.expires_at.toISOString().slice(0, 10) : ''} className={`${inputSm} ms-1`} /></label>
              <Submit tone="outline" size="sm" className="cursor-pointer">{t('Set end date')}</Submit>
            </form>
            {state === 'active' && <ActionButton action={adminRevokeAccess} fields={{ user_id: user.id }} tone="danger">{t('Revoke access')}</ActionButton>}
          </div>
          {user.payment_requests.length > 0 && (
            <ul className="mt-5 divide-y divide-[var(--d-line,#eef0f3)] border-t border-[var(--d-line,#eef0f3)] text-[13px]">
              {user.payment_requests.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/payment-requests/${payment.id}`} className="font-medium text-navy no-underline">{payment.method_name} · {Number(payment.amount).toLocaleString('en-PK')}</Link>
                  <span className="flex items-center gap-3 text-muted">{formatDate(payment.created_at, lang)} <Badge value={payment.status} label={PAYMENT_STATUS[payment.status]} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {user.role === 'user' && (
        <div className="mb-6">
          <Table
            head={['Profile', 'Location', 'Status', 'Verification', 'Actions']}
            empty={profiles.length === 0 ? 'This user has no profiles yet.' : null}
            toolbar={<h2 className="text-[15px] font-semibold text-navy">{t('Matrimonial profiles')}</h2>}
          >
            {profiles.map((profile) => {
              const code = profileCode(profile.id);
              return (
                <tr key={profile.id}>
                  <td><Link href={`/admin/profiles/${code}`} className="flex items-center gap-3 font-semibold text-navy no-underline"><Avatar name={profile.full_name} src={profile.photos[0] ? `/media/photos/${profile.photos[0].thumb}` : null} /> <span>{profile.full_name}<span className="block text-xs font-normal text-muted">{code}</span></span></Link></td>
                  <td>{[t(profile.city), t(profile.country_name)].filter(Boolean).join(', ')}</td>
                  <td><Badge value={profile.status} /></td>
                  <td><Badge value={profile.verification_status} /></td>
                  <td>
                    <div className="flex items-center gap-0.5">
                      <IconLink href={`/admin/profiles/${code}`} label="View" icon={<FaEye aria-hidden="true" />} />
                      <IconLink href={`/admin/profiles/${code}/edit`} label="Edit" icon={<FaPen aria-hidden="true" />} />
                      <ConfirmDelete action={removeProfile} fields={{ id: profile.id, next: `/admin/users/${user.id}` }} icon={<FaTrash aria-hidden="true" />} label="Delete profile" title={t('Delete profile {code}?', { code })} text="This permanently removes the profile, its photos and its CNIC. It cannot be undone." />
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </div>
      )}

      {profiles.map((profile) => (
        <Panel key={profile.id} title={t('Full biodata: {name} ({code})', { name: profile.full_name, code: profileCode(profile.id) })}>
          <div className="grid gap-6">
            {profileSections(profile).map((section) => (
              <section key={section.key}>
                <h3 className="mb-2 border-b border-[var(--d-line,#eef0f3)] pb-2 text-[13px] font-semibold text-navy">{t(section.title)}</h3>
                <dl className="grid grid-cols-3 gap-x-6 gap-y-3 max-p:grid-cols-2 max-m:grid-cols-1">
                  {section.rows.map((row) => (
                    <div key={row.name} className={String(row.value).length > 80 ? 'col-span-full' : ''}>
                      <dt className="text-xs text-muted">{t(row.label)}</dt>
                      <dd dir="auto" className="whitespace-pre-line text-[13px] font-medium text-navy">{t(row.value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </Panel>
      ))}
    </>
  );
}
