import Link from 'next/link';
import Image from 'next/image';
import { FaCalendarWeek, FaEye } from 'react-icons/fa6';
import { Card, EmptyState, PageHeader, StatTile } from '@/components/member/Ui';
import { ViewsChart } from '@/components/member/ViewsChart';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { memberProfiles } from '@/lib/dashboard.js';
import { recentViewers, viewStats } from '@/lib/engagement.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

async function Viewer({ item }) {
  const lang = await getLang();
  const name = item.card ? `${item.card.name}, ${item.card.age}` : item.member ? 'A member' : 'A visitor';
  const row = (
    <>
      {item.card?.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/media/photos/${item.card.photo}`} alt="" className="size-10 rounded-full object-cover" />
      ) : <Image src="/images/logo.png" alt="" width={40} height={40} className="rounded-full opacity-70" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-navy">{name}</span>
        <span className="block truncate text-xs text-muted">{item.card ? [item.card.city, item.card.country].filter(Boolean).join(', ') : 'Details are private'}</span>
      </span>
      <time className="shrink-0 text-[11px] text-muted">{formatDateTime(item.when, lang)}</time>
    </>
  );
  return (
    <li>
      {item.card ? <Link href={`/profile/${item.card.code}`} className="flex items-center gap-3 rounded-lg py-2.5 no-underline hover:bg-[var(--d-hover,#f7f8fa)]">{row}</Link> : <div className="flex items-center gap-3 py-2.5">{row}</div>}
    </li>
  );
}

export default async function ViewsPage() {
  const t = await getT();
  const lang = await getLang();
  const user = await requireUser('/dashboard/views');
  const ids = (await memberProfiles(user.id)).map((profile) => profile.id);
  const header = <PageHeader title={t('Profile views')} text={t('Each visitor is counted once a day, so these numbers reflect real interest.')} />;
  if (ids.length === 0) return <>{header}<EmptyState icon={<FaEye aria-hidden="true" />} title={t('Nothing to show yet')} text={t('You will see who is viewing your profile once it is live.')} action={<ButtonLink tone="gold" href="/dashboard/edit">{t('Create my biodata')}</ButtonLink>} /></>;
  const [stats, viewers] = await Promise.all([viewStats(ids), recentViewers(ids)]);
  return (
    <div>
      {header}
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <StatTile icon={<FaEye aria-hidden="true" />} label="Total views" value={stats.total} note={t('Since your profile went live')} href="/dashboard/views" />
          <StatTile icon={<FaCalendarWeek aria-hidden="true" />} label="Last 7 days" value={stats.lastWeek} note={t('Unique daily visitors')} href="/dashboard/views" />
        </div>
        <Card title={t('Views over the last 14 days')}><ViewsChart daily={stats.daily} /></Card>
        <Card title={t('Recent visitors')}>
          {viewers.length > 0 ? <ul className="divide-y divide-[var(--d-line,#eef0f3)]">{viewers.map((item) => <Viewer key={item.id} item={item} />)}</ul> : <p className="py-6 text-center text-[13px] text-muted">{t('No visitors yet.')}</p>}
        </Card>
      </div>
    </div>
  );
}
