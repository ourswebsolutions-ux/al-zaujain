import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { logActivity } from '@/lib/security.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function ChatLog({ params }) {
  const t = await getT();
  const lang = await getLang();
  const admin = await requireAdmin();
  const id = Number((await params).id);
  const db = getDb();
  if (!(await db.conversation.findUnique({ where: { id } }))) notFound();
  const messages = await db.message.findMany({ where: { conversation_id: id }, include: { sender: { select: { name: true } } }, orderBy: { id: 'asc' } });
  await logActivity(admin.id, 'conversation_viewed', `conversation:${id}`);
  return (
    <div className="max-w-[760px]">
      <Link href="/admin/chat" className="text-xs text-navy">{t('← Chat and messages')}</Link>
      <Title>{t('Conversation')}</Title>
      <Panel>
        <ul className="grid gap-3 text-[13px]">
          {messages.map((message) => (
            <li key={message.id} className="border-b border-[var(--d-line,#eee6d8)] pb-2">
              <strong>{message.sender.name}</strong> <time className="text-[11px] text-muted">{formatDateTime(message.created_at, lang)}</time>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
