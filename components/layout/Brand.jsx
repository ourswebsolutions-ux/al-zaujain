'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/components/i18n/LanguageProvider';

export function Brand({ tone = 'light', className = '' }) {
  const t = useT();
  const dark = tone === 'dark';
  return (
    <Link href="/" className={`flex items-center gap-[11px] no-underline max-m:gap-2 ${className}`}>
      <Image src="/images/logo.png" alt={t('Al Zaujain International Marriage Consultancy')} width={55} height={55} className="size-[55px] shrink-0 rounded-full bg-white object-cover max-m:size-11" />
      <span className={`block whitespace-nowrap text-xl font-bold leading-[22px] tracking-[0.5px] max-m:text-[16px] max-m:leading-[18px] ${dark ? 'text-white' : 'text-navy'}`}>
        AL ZAUJAIN
        <small className={`mt-1.5 block whitespace-nowrap text-[9px] font-semibold leading-[9.9px] tracking-[0.2px] max-m:mt-1 max-m:text-[8.5px] max-m:leading-[10px] ${dark ? 'text-champagne' : 'text-[#876623]'}`}>
          {t('Marriage Bureau Multan Pakistan')}
        </small>
      </span>
    </Link>
  );
}
