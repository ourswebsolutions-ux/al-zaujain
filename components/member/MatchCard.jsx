'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaLocationDot } from 'react-icons/fa6';
import { cardClass } from './Ui';
import { useT } from '@/components/i18n/LanguageProvider';
import { PhotoLock } from '@/components/payments/UnlockProvider';
import { SaveButton } from '@/components/profile/SaveButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { TypeBadge } from '@/components/profile/TypeBadge';

export function MatchCard({ card, saved }) {
  const t = useT();
  return (
    <article className={`${cardClass} group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-[var(--d-line,#dcc9a0)]`}>
      <div className="relative grid aspect-[5/4] place-items-center overflow-hidden bg-[var(--d-hover,#e9e1d1)]">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/photos/${card.photo}`} alt={t('Portrait of {name}', { name: card.name })} loading="lazy" className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <Image src="/images/logo.png" alt="" width={84} height={84} className="rounded-full opacity-60" />
        )}
        {card.photo && <PhotoLock type={card.type} />}
        <TypeBadge type={card.type} className="absolute bottom-3 left-3 z-10" />
        {card.score !== undefined && <span className="absolute left-3 top-3 rounded-full bg-navy px-2.5 py-1 text-[11px] font-semibold text-white">{t('{score}% match', { score: card.score })}</span>}
        {saved !== undefined && <SaveButton code={card.code} saved={saved} />}
      </div>
      <div className="p-4">
        <h3 className="truncate text-[15px] font-semibold text-navy">
          {card.name}, {card.age}{card.verified && <VerifiedBadge className="ml-1.5 text-sm" />}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted"><FaLocationDot aria-hidden="true" className="mr-1 inline-block text-[var(--d-gold,#b18433)]" />{[t(card.city), t(card.country)].filter(Boolean).join(', ')}</p>
        <p className="mt-1 truncate text-xs text-muted">{[card.education, t(card.profession)].filter(Boolean).join(' · ')}</p>
        <Link href={`/profile/${card.code}`} className="mt-3 block rounded-lg bg-cream py-2 text-center text-xs font-semibold text-navy no-underline transition-colors hover:bg-navy hover:text-white">{t('View profile')}</Link>
      </div>
    </article>
  );
}
