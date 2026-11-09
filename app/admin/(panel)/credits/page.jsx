import Link from 'next/link';
import { adjustCreditsAction, revokeUnlockAction } from '@/app/actions/credits';
import { ActionButton, Badge, FilterForm, Identity, Panel, SearchField, Stat, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { ActionForm, Submit } from '@/components/ui/Form';
import { requireAdmin } from '@/lib/auth.js';
import { creditSummary } from '@/lib/credits.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Credits and unlocks' };

const KIND = { purchase: 'Purchase', unlock: 'Unlock', adjustment: 'Adjustment', refund: 'Refund' };
const KIND_TONE = { purchase: 'approved', unlock: 'pending', adjustment: 'inactive', refund: 'approved' };

function Amount({ value }) {
  return <span dir="ltr" className={`font-semibold ${value > 0 ? 'text-[var(--d-green,#1f8a3a)]' : 'text-[var(--d-red,#a33a2c)]'}`}>{value > 0 ? `+${value}` : value}</span>;
}

async function Member({ userId }) {
  const [t, lang] = [await getT(), await getLang()];
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
  if (!user) return <Panel><p className="text-sm text-muted">{t('Member not found.')}</p></Panel>;
  const summary = await creditSummary(user.id);
  const actors = new Map((await db.user.findMany({ where: { id: { in: summary.transactions.map((row) => row.actor_id).filter(Boolean) } }, select: { id: true, name: true } })).map((row) => [row.id, row.name]));
  return (
    <>
      <Link href="/admin/credits" className="text-[13px] text-navy">← {t('All members')}</Link>
      <div className="mt-3"><Title text={user.email}>{user.name}</Title></div>
      <div className="mb-6 grid grid-cols-4 gap-4 max-p:grid-cols-2">
        <Stat label="Available credits" value={summary.balance} />
        <Stat label="Credits purchased" value={summary.purchased} />
        <Stat label="Credits used" value={summary.used} />
        <Stat label="Unlocked profiles" value={summary.unlocks.length} />
      </div>
      <Panel title="Adjust credits">
        <ActionForm action={adjustCreditsAction} className="grid gap-3">
          <input type="hidden" name="user_id" value={user.id} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-[12.5px] font-medium">{t('Change')}
              <select name="direction" className={inputSm}><option value="add">{t('Add credits')}</option><option value="remove">{t('Remove credits')}</option></select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-medium">{t('Credits')}<input name="amount" type="number" min="1" max="100000" required className={`${inputSm} w-28`} /></label>
            <label className="grid min-w-64 flex-1 gap-1 text-[12.5px] font-medium">{t('Reason (required, kept in the history)')}<input name="reason" required minLength={3} maxLength={500} placeholder={t('e.g. Compensation for a wrong number')} className={inputSm} /></label>
            <Submit size="sm" className="cursor-pointer">{t('Apply')}</Submit>
          </div>
        </ActionForm>
      </Panel>
      <h2 className="mb-3 text-[15px] font-semibold text-navy">{t('Unlocked profiles')}</h2>
      <Table head={['Profile', 'Credits', 'Unlocked', '']} empty={summary.unlocks.length === 0 ? 'No unlocked profiles.' : null}>
        {summary.unlocks.map((row) => (
          <tr key={row.id}>
            <td><Link href={`/admin/profiles/${row.code}`} className="font-semibold text-navy">{row.name} · {row.code}</Link></td>
            <td>{row.credits}</td>
            <td className="whitespace-nowrap">{formatDateTime(row.at, lang)}</td>
            <td>
              <div className="flex flex-wrap justify-end gap-2">
                <ActionButton action={revokeUnlockAction} fields={{ id: row.id, refund: '1' }} tone="outline">{t('Remove and refund')}</ActionButton>
                <ActionButton action={revokeUnlockAction} fields={{ id: row.id, refund: '0' }} tone="outline">{t('Remove')}</ActionButton>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <h2 className="mb-3 mt-6 text-[15px] font-semibold text-navy">{t('Credit history')}</h2>
      <Table head={['Date', 'Type', 'Change', 'Balance after', 'Details', 'By']} empty={summary.transactions.length === 0 ? 'No credit activity yet.' : null}>
        {summary.transactions.map((row) => (
          <tr key={row.id}>
            <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
            <td><Badge value={KIND_TONE[row.kind]} label={KIND[row.kind]} /></td>
            <td><Amount value={row.amount} /></td>
            <td>{row.balance_after}</td>
            <td className="max-w-[340px]">{[row.reference, row.note].filter(Boolean).join(' · ')}</td>
            <td>{row.actor_id ? actors.get(row.actor_id) ?? '—' : t('Member')}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

export default async function Credits({ searchParams }) {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const query = await searchParams;
  const userId = Number(query.user) || null;
  if (userId) return <Member userId={userId} />;
  const db = getDb();
  const q = String(query.q ?? '').trim();
  const members = await db.user.findMany({
    where: { role: 'user', ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : { OR: [{ credits: { gt: 0 } }, { credit_transactions: { some: {} } }] }) },
    select: { id: true, name: true, email: true, credits: true, _count: { select: { profile_unlocks: true } } },
    orderBy: [{ credits: 'desc' }, { id: 'desc' }],
    take: 60,
  });
  const [totals, recent, unlocks] = await Promise.all([
    db.creditTransaction.groupBy({ by: ['kind'], _sum: { amount: true } }),
    db.creditTransaction.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { id: 'desc' }, take: 25 }),
    db.profileUnlock.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { id: 'desc' }, take: 25 }),
  ]);
  const sum = (kind) => totals.find((row) => row.kind === kind)?._sum.amount ?? 0;
  const outstanding = (await db.user.aggregate({ _sum: { credits: true } }))._sum.credits ?? 0;
  return (
    <>
      <Title text="Every member's premium credits. Every change is recorded with who made it and why.">{t('Credits and unlocks')}</Title>
      <div className="mb-6 grid grid-cols-4 gap-4 max-p:grid-cols-2">
        <Stat label="Credits sold" value={sum('purchase')} />
        <Stat label="Credits used on unlocks" value={-sum('unlock')} />
        <Stat label="Credits still unused" value={outstanding} />
        <Stat label="Profiles unlocked" value={await db.profileUnlock.count()} />
      </div>
      <Table
        head={['Member', 'Available credits', 'Unlocked profiles', '']}
        empty={members.length === 0 ? (q ? 'No members found.' : 'No member has credits yet.') : null}
        toolbar={<FilterForm clearHref="/admin/credits" active={!!q}><SearchField value={q} placeholder="Search any member by name or email" /></FilterForm>}
      >
        {members.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.name} sub={row.email} href={`/admin/credits?user=${row.id}`} /></td>
            <td className="font-semibold text-navy">{row.credits}</td>
            <td>{row._count.profile_unlocks}</td>
            <td><Link href={`/admin/credits?user=${row.id}`} className="text-[13px] font-medium text-navy">{t('Manage')}</Link></td>
          </tr>
        ))}
      </Table>
      <div className="mt-6 grid grid-cols-2 gap-6 max-p:grid-cols-1">
        <div className="min-w-0">
          <h2 className="mb-3 text-[15px] font-semibold text-navy">{t('Recent credit activity')}</h2>
          <Table head={['Member', 'Type', 'Change', 'Date']} empty={recent.length === 0 ? 'No credit activity yet.' : null}>
            {recent.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/credits?user=${row.user.id}`} className="text-navy">{row.user.name}</Link></td>
                <td><Badge value={KIND_TONE[row.kind]} label={KIND[row.kind]} /></td>
                <td><Amount value={row.amount} /></td>
                <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="min-w-0">
          <h2 className="mb-3 text-[15px] font-semibold text-navy">{t('Recent unlocks')}</h2>
          <Table head={['Member', 'Profile', 'Date']} empty={unlocks.length === 0 ? 'No unlocks yet.' : null}>
            {unlocks.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/credits?user=${row.user.id}`} className="text-navy">{row.user.name}</Link></td>
                <td><Link href={`/admin/profiles/${profileCode(row.profile_id)}`} className="text-navy">{profileCode(row.profile_id)}</Link></td>
                <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </>
  );
}
