'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaLocationDot } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

export function ConsultantPhoto({ consultant, className = '' }) {
  return consultant.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/media/consultants/${consultant.photo}`} alt={`Portrait of ${consultant.display_name}`} className={`object-cover ${className}`} />
  ) : (
    <div className={`grid place-items-center bg-[#e9e1d1] ${className}`}><Image src="/images/logo.png" alt="" width={110} height={110} className="rounded-full opacity-60" /></div>
  );
}

export function ConsultantCard({ consultant }) {
  const t = useT();
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white p-2.5 font-nunito text-navy shadow-[0_6px_22px_#03223f08] transition-[box-shadow,border-color] duration-[250ms] hover:border-gold hover:shadow-[0_16px_35px_#03223f18]">
      <ConsultantPhoto consultant={consultant} className="aspect-square w-full rounded-2xl" />
      <div className="px-3 pb-3 pt-5">
        <h2 className="mb-1 text-[23px] font-extrabold leading-[27.6px]">{consultant.display_name}</h2>
        <p className="text-[13px] font-semibold text-[#9b712b]">{t(consultant.title)}</p>
        {consultant.city && <p className="mb-3 mt-1 text-[13px] text-muted"><FaLocationDot aria-hidden="true" className="mr-[5px] inline-block text-[#b18433]" />{t(consultant.city)}</p>}
        <Link href={`/consultants/${consultant.slug}`} className="group mt-3 flex items-center justify-between gap-2 rounded-xl bg-cream p-[15px] text-[13px] font-bold text-navy no-underline transition-colors hover:bg-navy hover:text-white">
          {t('View consultant')} <FaArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-[3px]" />
        </Link>
      </div>
    </article>
  );
}
