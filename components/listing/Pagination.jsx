import Link from 'next/link';
import { getT } from '@/lib/i18n/server.js';

export async function Pagination({ page, pages, buildHref }) {
  const t = await getT();
  if (pages <= 1) return null;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])].filter((value) => value >= 1 && value <= pages);
  const item = 'grid min-w-10 place-items-center rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-navy no-underline hover:bg-cream';
  return (
    <nav aria-label={t('Pagination')} className="mt-9 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link rel="prev" href={buildHref(page - 1)} className={item}>{t('← Previous')}</Link>}
      {numbers.map((number) => (
        number === page
          ? <span key={number} aria-current="page" className={`${item} border-navy bg-navy text-white hover:bg-navy`}>{number}</span>
          : <Link key={number} href={buildHref(number)} className={item}>{number}</Link>
      ))}
      {page < pages && <Link rel="next" href={buildHref(page + 1)} className={item}>{t('Next →')}</Link>}
    </nav>
  );
}
