import { ChatList } from '@/components/chat/ChatList';
import { PageHeader } from '@/components/member/Ui';
import { requireUser } from '@/lib/auth.js';
import { chatEnabled, listConversations } from '@/lib/chat.js';
import { getT } from '@/lib/i18n/server.js';

export default async function MessagesPage() {
  const t = await getT();
  const user = await requireUser('/messages');
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title={t('Messages')} text={t('Your conversations with members and your consultant.')} />
      {!(await chatEnabled()) && <p className="mb-4 rounded-md bg-[var(--d-gold-bg,#fcf4e1)] p-3 text-xs font-semibold text-[var(--d-gold,#806126)]">{t('Chat is currently switched off. You can still read your message history.')}</p>}
      <div className="overflow-hidden rounded-2xl border border-[var(--d-line,#e7e9ee)] bg-white shadow-[0_10px_28px_#03223f08]"><ChatList conversations={await listConversations(user.id)} /></div>
    </div>
  );
}
