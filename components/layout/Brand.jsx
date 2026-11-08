'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/components/i18n/LanguageProvider';

export function Brand({ tone = 'light', className = '' }) {
  const t = useT();
  const dark = tone === 'dark';
  return (
    <Link href="/" className={`flex items-center gap-[11px] no-underline max-m:gap-[7px] ${className}`}>
      <Image src="/images/logo.png" alt={t('Al Zaujain International Marriage Consultancy')} width={55} height={55} className="size-[55px] rounded-full bg-white object-cover" />
      <span className={`block text-xl font-bold leading-[22px] tracking-[0.5px] max-m:text-[15px] max-m:leading-[16.5px] ${dark ? 'text-white' : 'text-navy'}`}>
        AL ZAUJAIN
        <small className={`mt-1.5 block text-[9px] font-semibold leading-[9.9px] tracking-[0.2px] max-m:mt-[5px] max-m:text-[7px] max-m:leading-[7.7px] ${dark ? 'text-champagne' : 'text-[#876623]'}`}>
          <span className="max-m:hidden">{t('International Marriage Consultancy')}</span>
          <span className="m:hidden">{t('International Consultancy')}</span>
        </small>
      </span>
    </Link>
  );
}
