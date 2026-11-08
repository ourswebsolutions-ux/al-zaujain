import Link from 'next/link';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export async function ChatList({ conversations, basePath = '/messages', activeId }) {
  const t = await getT();
  const lang = await getLang();
  if (conversations.length === 0) return <p className="p-6 text-center text-sm text-muted">{t('No conversations yet. Open a proposal and choose Chat now to begin.')}</p>;
  return (
    <ul>
      {conversations.map((item) => (
        <li key={item.id}>
          <Link href={`${basePath}/${item.id}`} className={`flex items-center gap-3 border-b border-[var(--d-line,#eee6d8)] p-4 no-underline hover:bg-cream ${item.id === activeId ? 'bg-cream' : ''}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#062b4e] text-sm font-bold text-champagne">{item.other_name[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2">
                <strong className={`truncate text-sm ${item.unread ? 'text-navy' : 'font-semibold text-navy'}`}>{item.other_name}</strong>
                <time className="shrink-0 text-[10px] text-muted">{formatDateTime(item.last_message_at, lang)}</time>
              </span>
              <span className="block truncate text-xs text-muted">{item.preview}</span>
            </span>
            {item.unread > 0 && <span aria-label={`${item.unread} unread`} className="grid size-5 shrink-0 place-items-center rounded-full bg-gold text-[10px] font-bold text-dark">{item.unread}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
