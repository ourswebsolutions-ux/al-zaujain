import Link from 'next/link';
import { ChatSettingsForm } from '@/components/admin/SettingsForms';
import { Panel, Table, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getSettings } from '@/lib/settings.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Chat() {
  const t = await getT();
  const lang = await getLang();
  await requireAdmin();
  const rows = await getDb().conversation.findMany({
    where: { last_message_at: { not: null } },
    include: { low: { select: { name: true } }, high: { select: { name: true } }, _count: { select: { messages: true } } },
    orderBy: { last_message_at: 'desc' },
    take: 100,
  });
  return (
    <>
      <Title>{t('Chat and messages')}</Title>
      <Panel title={t('Settings')}><ChatSettingsForm settings={await getSettings()} /><p className="mt-3 text-xs text-muted">{t('To restrict one person, use Restrict chat on the Users page.')}</p></Panel>
      <Table head={['Conversation', 'Messages', 'Last message']} empty={rows.length === 0 ? 'No conversations yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Link href={`/admin/chat/${row.id}`} className="font-semibold text-navy">{row.low.name} and {row.high.name}</Link></td>
            <td>{row._count.messages}</td>
            <td className="whitespace-nowrap">{formatDateTime(row.last_message_at, lang)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
