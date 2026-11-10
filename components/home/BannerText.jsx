'use client';

import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const SIZES = {
  sm: { heading: 'text-[34px]', text: 'text-[15px]' },
  md: { heading: 'text-[46px]', text: 'text-[17px]' },
  lg: { heading: 'text-[58px]', text: 'text-[19px]' },
};

const isExternal = (href) => /^(https?:|tel:|mailto:)/i.test(href);

function Cta({ href, primary, dark, preview, children }) {
  const className = primary
    ? 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#f4d889,#c99432)] px-7 text-[15px] font-bold text-dark no-underline shadow-[0_8px_22px_#c9943259] transition-transform hover:-translate-y-0.5 hover:text-dark max-sm:min-h-11 max-sm:px-5 max-sm:text-sm'
    : `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 px-7 text-[15px] font-bold no-underline transition-colors max-sm:min-h-11 max-sm:px-5 max-sm:text-sm ${dark ? 'border-navy text-navy hover:bg-navy hover:text-white' : 'border-white/80 text-white backdrop-blur-sm hover:bg-white hover:text-navy'}`;
  if (preview || !href) return <span className={className}>{children}</span>;
  if (isExternal(href)) return <a href={href} target="_blank" rel="noopener" className={className}>{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

/**
 * The words on a banner, placed where the administrator dragged them (a percentage of the banner's
 * width and height). On phones the text sits along the bottom instead, where it always fits.
 * The admin designer renders this same component, so its preview matches the website.
 */
export function BannerText({ banner, preview = false }) {
  const t = useT();
  const dark = banner.textTheme === 'dark';
  const size = SIZES[banner.textSize] ?? SIZES.md;
  const align = { start: 'text-start items-start', center: 'text-center items-center', end: 'text-end items-end' }[banner.textAlign] ?? 'text-start items-start';
  const tr = (value) => (preview ? value : t(value));
  return (
    <div
      style={{ left: `${banner.textX}%`, top: `${banner.textY}%`, transform: `translate(-${banner.textX}%, -${banner.textY}%)` }}
      className={`absolute z-[2] flex w-max max-w-[min(640px,88%)] flex-col ${align} ${dark ? 'text-navy' : 'text-white'} ${preview ? '' : 'max-sm:!bottom-12 max-sm:!left-5 max-sm:!right-5 max-sm:!top-auto max-sm:!w-auto max-sm:!max-w-none max-sm:!transform-none'}`}
    >
      {banner.eyebrow && <p className={`mb-3 text-[13px] font-semibold uppercase tracking-[3px] max-sm:mb-2 max-sm:text-[10.5px] max-sm:tracking-[2px] ${dark ? 'text-[#a17a33]' : 'text-champagne'}`}>{tr(banner.eyebrow)}</p>}
      {banner.heading && <h2 className={`${size.heading} font-bold leading-[1.15] tracking-[-0.5px] max-p:text-[38px] max-sm:!text-[26px] max-sm:leading-[1.25] ${dark ? '' : '[text-shadow:0_2px_18px_#03223f80]'}`}>{tr(banner.heading)}</h2>}
      {banner.urdu && <p lang="ur" dir="rtl" className={`mt-2 font-urdu text-[26px] leading-[2] max-sm:text-lg ${dark ? 'text-[#a17a33]' : 'text-champagne'}`}>{banner.urdu}</p>}
      {banner.text && <p className={`mt-3 max-w-[540px] ${size.text} leading-[1.65] max-sm:mt-2 max-sm:!text-[13.5px] max-sm:leading-[1.55] ${dark ? 'text-[#2f3b4a]' : 'text-white/90'}`}>{tr(banner.text)}</p>}
      {((banner.cta && banner.href) || (banner.cta2 && banner.href2) || (preview && (banner.cta || banner.cta2))) && (
        <div className="mt-7 flex flex-wrap gap-3 max-sm:mt-5 max-sm:gap-2.5">
          {banner.cta && <Cta href={banner.href} primary preview={preview}>{tr(banner.cta)} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></Cta>}
          {banner.cta2 && <Cta href={banner.href2} dark={dark} preview={preview}>{tr(banner.cta2)}</Cta>}
        </div>
      )}
    </div>
  );
}

// The tint over the picture that keeps the words readable.
export function BannerShade({ banner }) {
  if (!banner.showText) return null;
  const dark = banner.textTheme === 'dark';
  const strength = { none: '', soft: dark ? 'bg-white/30' : 'bg-[#03223f]/30', strong: dark ? 'bg-white/60' : 'bg-[#03223f]/60' }[banner.shade] ?? '';
  return (
    <>
      {strength && <div aria-hidden="true" className={`absolute inset-0 z-[1] ${strength}`} />}
      <div aria-hidden="true" className={`absolute inset-0 z-[1] hidden max-sm:block ${dark ? 'bg-[linear-gradient(180deg,transparent_35%,#ffffffe6_100%)]' : 'bg-[linear-gradient(180deg,transparent_30%,#03223ff2_100%)]'}`} />
    </>
  );
}
