import Link from 'next/link';
import { FaCircleCheck, FaClock, FaComments, FaEnvelopeOpenText, FaIdCard, FaPeopleGroup, FaRegAddressCard, FaUserCheck } from 'react-icons/fa6';
import { approveProfile } from '@/app/actions/admin';
import { ActionButton, Avatar, Panel, Stat, Table, Title } from '@/components/admin/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { smtpReady } from '@/lib/mail.js';

export default async function AdminHome() {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const db = getDb();
  const [total, pending, live, verified, cnic, users, messages, enquiries, waiting, grouped, categories] = await Promise.all([
    db.profile.count(),
    db.profile.count({ where: { status: 'pending' } }),
    db.profile.count({ where: { status: 'approved' } }),
    db.profile.count({ where: { verification_status: 'verified' } }),
    db.profile.count({ where: { verification_status: 'pending' } }),
    db.user.count({ where: { role: 'user' } }),
    db.message.count(),
    db.enquiry.count({ where: { handled: false } }),
    db.profile.findMany({ where: { status: 'pending' }, select: { id: true, full_name: true, city: true, created_at: true, verification_status: true }, orderBy: { created_at: 'desc' }, take: 6 }),
    db.profile.groupBy({ by: ['country_id'], where: { status: 'approved' }, _count: { id: true } }),
    db.country.findMany({ select: { id: true, category: { select: { name: true } } } }),
  ]);
  const categoryOf = new Map(categories.map((country) => [country.id, country.category?.name ?? 'Other']));
  const totals = new Map();
  for (const row of grouped) {
    const name = categoryOf.get(row.country_id) ?? 'Other';
    totals.set(name, (totals.get(name) ?? 0) + row._count.id);
  }
  const byCategory = [...totals].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...byCategory.map((row) => row.n));
  return (
    <>
      <Title text="An overview of profiles, members and work waiting for you.">{t('Dashboard')}</Title>
      {!(await smtpReady()) && <p className="mb-5 rounded-lg bg-[#e4b6532b] p-3 text-[13px] font-medium text-[var(--d-gold,#946c13)]">{t('SMTP is not configured, so no emails are being sent. Add your details under Email server.')}</p>}
      <div className="mb-6 grid grid-cols-4 gap-5 max-p:grid-cols-2 max-m:grid-cols-1">
        <Stat icon={<FaIdCard aria-hidden="true" />} tone="navy" label="Total profiles" value={total} href="/admin/profiles" />
        <Stat icon={<FaClock aria-hidden="true" />} tone="amber" label="Awaiting review" value={pending} href="/admin/profiles?status=pending" />
        <Stat icon={<FaCircleCheck aria-hidden="true" />} tone="green" label="Live proposals" value={live} href="/admin/profiles?status=approved" />
        <Stat icon={<FaUserCheck aria-hidden="true" />} tone="blue" label="Verified" value={verified} href="/admin/profiles" />
        <Stat icon={<FaRegAddressCard aria-hidden="true" />} tone="amber" label="CNIC to review" value={cnic} href="/admin/verification" />
        <Stat icon={<FaPeopleGroup aria-hidden="true" />} tone="navy" label="Registered users" value={users} href="/admin/users" />
        <Stat icon={<FaComments aria-hidden="true" />} tone="blue" label="Messages" value={messages} href="/admin/chat" />
        <Stat icon={<FaEnvelopeOpenText aria-hidden="true" />} tone="red" label="New enquiries" value={enquiries} href="/admin/enquiries" />
      </div>
      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-6 max-p:grid-cols-1">
        <Table
          head={['Profile', 'City', 'Submitted', '']}
          empty={waiting.length === 0 ? 'All done. Nothing is waiting for you.' : null}
          toolbar={<><h2 className="text-[15px] font-semibold text-navy">{t('Needs your approval')}</h2><Link href="/admin/profiles?status=pending" className="text-[13px] font-medium text-[var(--d-gold,#9b712b)] no-underline">{t('View all')}</Link></>}
        >
          {waiting.map((row) => (
            <tr key={row.id}>
              <td><Link href={`/admin/profiles/${profileCode(row.id)}`} className="flex items-center gap-3 font-semibold text-navy no-underline"><Avatar name={row.full_name} /> <span>{row.full_name}<span className="block text-xs font-normal text-muted">{profileCode(row.id)}</span></span></Link></td>
              <td>{t(row.city)}</td>
              <td className="whitespace-nowrap">{formatDate(row.created_at, lang)}</td>
              <td className="text-right">
                <span className="flex justify-end gap-2">
                  <ButtonLink tone="outline" size="sm" href={`/admin/profiles/${profileCode(row.id)}`}>{t('Review')}</ButtonLink>
                  <ActionButton action={approveProfile} fields={{ id: row.id }}>{t('Approve')}</ActionButton>
                </span>
              </td>
            </tr>
          ))}
        </Table>
        <Panel title="Live proposals by region" className="mb-0!">
          <ul className="grid gap-4">
            {byCategory.map((row) => (
              <li key={row.name} className="text-[13px]">
                <span className="mb-1.5 flex justify-between"><span className="text-navy">{t(row.name)}</span><span className="font-semibold text-navy">{row.n}</span></span>
                <progress value={row.n} max={max} aria-label={t(row.name)} className="block h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-navy [&::-webkit-progress-bar]:bg-[var(--d-hover,#eef0f3)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-navy" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
