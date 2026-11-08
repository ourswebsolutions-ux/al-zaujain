import Link from 'next/link';
import { Badge, Panel, Table, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Emails() {
  const t = await getT();
  const lang = await getLang();
  await requireAdmin();
  const db = getDb();
  const templates = await db.emailTemplate.findMany({ select: { key: true, name: true, subject: true, enabled: true }, orderBy: { name: 'asc' } });
  const log = await db.emailLog.findMany({ orderBy: { id: 'desc' }, take: 50 });
  return (
    <>
      <Title>{t('Email messages')}</Title>
      <Panel title={t('Templates')}>
        <ul className="grid gap-1.5 text-[13px]">
          {templates.map((template) => (
            <li key={template.key} className="flex items-center justify-between gap-3 border-b border-[var(--d-line,#eee6d8)] pb-1.5">
              <Link href={`/admin/emails/${template.key}`} className="font-semibold text-navy">{template.name}</Link>
              <Badge value={template.enabled ? 'active' : 'off'} />
            </li>
          ))}
        </ul>
      </Panel>
      <h2 className="mb-3 font-quicksand text-base font-bold">{t('Recent emails')}</h2>
      <Table head={['To', 'Subject', 'Status', 'When']} empty={log.length === 0 ? 'No emails yet.' : null}>
        {log.map((row) => (
          <tr key={row.id}>
            <td>{row.recipient}</td>
            <td>{row.subject}{row.error && <span className="block text-[11px] text-[var(--d-red,#a33a2c)]">{row.error}</span>}</td>
            <td><Badge value={row.status} /></td>
            <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
