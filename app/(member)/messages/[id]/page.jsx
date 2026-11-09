import { KEEP_LIGHT } from '@/lib/theme.js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { toggleBlock } from '@/app/actions/profile';
import { ChatList } from '@/components/chat/ChatList';
import { ChatThread } from '@/components/chat/ChatThread';
import { Button } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { chatBlockReason, conversationFor, fetchMessages, isBlockedBy, listConversations } from '@/lib/chat.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function ConversationPage({ params }) {
  const t = await getT();
  const user = await requireUser('/messages');
  const id = Number((await params).id);
  const conversation = await conversationFor(id, user.id);
  if (!conversation) notFound();
  const otherId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
  const other = await getDb().user.findUnique({ where: { id: otherId }, select: { name: true } });
  const blockedByMe = await isBlockedBy(user.id, otherId);
  const messages = await fetchMessages(id, user.id);

  return (
    <div className="grid h-[calc(100dvh-124px)] min-h-[460px] grid-cols-[300px_1fr] overflow-hidden rounded-2xl border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_10px_28px_#03223f08] max-b:h-[calc(100dvh-180px)] max-b:grid-cols-1 max-m:h-[calc(100dvh-160px)]">
      <aside data-native-scroll className="overflow-y-auto border-e border-line max-b:hidden"><ChatList conversations={await listConversations(user.id)} activeId={id} /></aside>
      <section className="flex min-h-0 min-w-0 flex-col">
        <header className={`${KEEP_LIGHT} flex items-center justify-between gap-3 bg-navy px-5 py-3 text-white`}>
          <div className="min-w-0">
            <Link href="/messages" className="hidden text-[11px] text-champagne no-underline max-b:block">{t('← All messages')}</Link>
            <strong className="block truncate text-sm">{other.name}</strong>
          </div>
          <form action={toggleBlock}>
            <input type="hidden" name="other" value={otherId} />
            <input type="hidden" name="conversation" value={id} />
            <input type="hidden" name="blocked" value={blockedByMe ? '0' : '1'} />
            <Button type="submit" tone="outline" size="sm" className="cursor-pointer">{t(blockedByMe ? 'Unblock' : 'Block')}</Button>
          </form>
        </header>
        <ChatThread conversationId={id} currentUserId={user.id} initialMessages={messages} initialBlock={await chatBlockReason(user, otherId)} />
      </section>
    </div>
  );
}
