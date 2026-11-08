'use client';

import { useT } from '@/components/i18n/LanguageProvider';

// A CSS-only ticker: two identical tracks scroll half their combined width, so the loop is seamless.
function Track({ messages, hidden }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {messages.map((message) => (
        <li key={message} className="flex items-center whitespace-nowrap">
          <span className="font-medium tracking-[.5px]">{message}</span>
          <span aria-hidden="true" className="mx-5 size-[5px] rotate-45 bg-gold-soft" />
        </li>
      ))}
    </ul>
  );
}

export function AnnouncementBar({ messages }) {
  const t = useT();
  if (messages.length === 0) return <span className="min-w-0 flex-1" />;
  const translated = messages.map((message) => t(message));
  return (
    <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        <Track messages={translated} />
        <Track messages={translated} hidden />
      </div>
    </div>
  );
}
