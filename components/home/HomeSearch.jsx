import { FaMagnifyingGlass } from 'react-icons/fa6';
import { getT } from '@/lib/i18n/server.js';

/**
 * The single search box on the homepage banner, along its bottom edge over the picture. It searches approved profiles by name, profile ID,
 * city, country, caste or profession, and opens the results on the Proposals page.
 */
export async function HomeSearch() {
  const t = await getT();
  return (
    <div id="search" className="px-[5%] max-sm:px-4">
      <form action="/proposals" role="search" aria-label={t('Search proposals')} className="mx-auto flex w-full max-w-[920px] items-center gap-2 rounded-full border border-white/70 bg-white/95 p-1.5 ps-5 shadow-[0_14px_40px_#03223f59] backdrop-blur-md focus-within:border-gold focus-within:shadow-[0_14px_40px_#c9943259] max-sm:ps-4">
        <FaMagnifyingGlass aria-hidden="true" className="shrink-0 text-[17px] text-[#a17a33]" />
        <label htmlFor="home-search" className="sr-only">{t('Search by name, profile ID, city, country or caste')}</label>
        <input
          id="home-search"
          name="q"
          type="search"
          maxLength={80}
          autoComplete="off"
          placeholder={t('Search name, ID, city or caste')}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15.5px] text-navy outline-none placeholder:text-[#8c95a0] max-sm:text-[14px]"
        />
        <button type="submit" className="inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(135deg,#0d3d6b,#062b4e)] px-7 text-[15px] font-semibold text-white shadow-[0_6px_16px_#062b4e40] transition-transform hover:-translate-y-px max-sm:min-h-11 max-sm:px-4">
          <FaMagnifyingGlass aria-hidden="true" className="sm:hidden" /><span className="max-sm:sr-only">{t('Search')}</span>
        </button>
      </form>
    </div>
  );
}
