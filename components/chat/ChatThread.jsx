'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa6';
import { useUnlock } from '@/components/payments/UnlockProvider';
import { Button } from '@/components/ui/Button';
import { INBOX_LOCKED } from '@/lib/access-text.js';
import { formatDateTime } from '@/lib/format.js';
import { useLang, useT } from '@/components/i18n/LanguageProvider';

const POLL_MS = 4000;

export function ChatThread({ conversationId, currentUserId, initialMessages, initialBlock }) {
  const t = useT();
  const lang = useLang();
  const { openUnlock } = useUnlock();
  const [messages, setMessages] = useState(initialMessages);
  const [block, setBlock] = useState(initialBlock);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const log = useRef(null);
  const lastId = useRef(initialMessages.at(-1)?.id ?? 0);

  const merge = useCallback((incoming) => {
    if (incoming.length === 0) return;
    lastId.current = Math.max(lastId.current, ...incoming.map((message) => message.id));
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      return [...current, ...incoming.filter((message) => !known.has(message.id))];
    });
  }, []);

  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/chat/${conversationId}?after=${lastId.current}`);
        if (!response.ok) return;
        const data = await response.json();
        merge(data.messages);
        setBlock(data.blocked);
      } catch {
        // A missed poll is harmless: the next one catches up.
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, merge]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/chat/${conversationId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.upgrade) openUnlock();
        else setError(t(data.message));
        return;
      }
      merge([data.message]);
      setText('');
    } catch {
      setError('Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={log} data-native-scroll role="log" aria-live="polite" tabIndex={0} className="min-h-[300px] flex-1 overflow-y-auto bg-paper p-5">
        {messages.length === 0 && <p className="mt-10 text-center text-sm text-muted">{t('Say salaam to begin the conversation.')}</p>}
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-[21px] ${mine ? 'rounded-[14px_14px_3px_14px] bg-navy text-white' : 'rounded-[14px_14px_14px_3px] border border-line bg-white text-navy'}`}>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <time className={`mt-1 block text-[10px] ${mine ? 'text-[#c1cdd6]' : 'text-muted'}`}>{formatDateTime(message.created_at, lang)}{t(mine && message.read_at ? ' · Read' : '')}</time>
              </div>
            </div>
          );
        })}
      </div>
      {block ? (
        <div className="border-t border-line bg-[var(--d-gold-bg,#fcf4e1)] p-4 text-center text-xs font-semibold text-[var(--d-gold,#806126)]">
          {t(block)}
          {block === INBOX_LOCKED && <button type="button" onClick={openUnlock} className="ml-2 cursor-pointer underline">{t('Unlock Full Profile Access')}</button>}
        </div>
      ) : (
        <form onSubmit={send} className="flex gap-2 border-t border-line bg-white p-3">
          <input value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} aria-label={t('Write a message')} placeholder={t('Write a message…')} className="min-w-0 flex-1 rounded-[9px] border border-[var(--d-line,#dce0dc)] bg-[var(--d-hover,#fafbf9)] px-3.5 text-sm text-navy focus:border-gold focus:outline-none" />
          <Button type="submit" disabled={sending || !text.trim()} className="cursor-pointer" aria-label={t('Send message')}><FaPaperPlane aria-hidden="true" /></Button>
        </form>
      )}
      {error && <p role="alert" className="bg-[var(--d-red-bg,#fbeeec)] p-2 text-center text-xs text-[var(--d-red,#a33a2c)]">{error}</p>}
    </div>
  );
}
