import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaComments, FaHeart, FaLocationDot, FaPeopleRoof, FaPhone, FaWhatsapp } from 'react-icons/fa6';
import { Brand } from './Brand';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

const linkClass = 'mb-[13px] block text-xs leading-[18px] text-[#e0e6eb] no-underline hover:text-champagne';
const icon = 'me-[7px] inline-block align-[-2px] text-champagne';

export async function Footer({ settings }) {
  const t = await getT();
  return (
    <footer className="relative overflow-hidden bg-dark px-[6%] pt-[42px] text-white">
      <Image src="/images/pakistani-couple.png" alt="" fill sizes="100vw" className="object-cover opacity-[.08]" />
      <Reveal y={12} duration={0.8} className="relative z-10 mb-9 flex items-center justify-between gap-[30px] border-b border-white/15 pb-[33px] max-m:mb-[30px] max-m:block max-m:pb-7">
        <div>
          <SectionTag className="text-[9px]! leading-[13.5px]! text-champagne!">{t('YOUR FAMILY’S NEXT CHAPTER')}</SectionTag>
          <h2 className="mb-2.5 text-[28px] font-medium leading-[33.6px] max-m:mb-5 max-m:text-[25px] max-m:leading-[35px]">{t('Let’s begin with a conversation.')}</h2>
        </div>
        <ButtonLink tone="gold" href="/#contact">{t('Talk to Al Zaujain')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></ButtonLink>
      </Reveal>

      <div className="relative z-10 grid grid-cols-[1.25fr_.8fr_1fr] gap-[60px] pb-5 max-b:gap-[30px] max-m:grid-cols-1 max-m:gap-7">
        <div>
          <Brand tone="dark" />
          <p className="mb-4 mt-5 max-w-[340px] text-[11px] leading-[19.8px] text-[#c1cdd6] max-m:mt-3 max-m:text-xs max-m:leading-[21.6px]">{t(settings.footer_about)}</p>
        </div>
        <div>
          <h3 className="mb-5 text-[13px] font-medium leading-[15.6px] max-m:mb-3.5">{t('Explore Al Zaujain')}</h3>
          <Link className={linkClass} href="/#how-it-works">{t('How it works')} <FaArrowRight aria-hidden="true" className={`${icon} ms-1`} className="rtl:-scale-x-100" /></Link>
          <Link className={linkClass} href="/proposals">{t('Browse proposals')}</Link>
          <Link className={linkClass} href="/consultants">{t('Marriage consultants')}</Link>
          <Link className={linkClass} href="/fees">{t('Consultancy fees')}</Link>
          <Link className={linkClass} href="/submit-profile">{t('Submit a profile')}</Link>
          <Link className={linkClass} href="/#registration">{t('Registration information')}</Link>
          <Link className={linkClass} href="/#android-app">{t('Android app')}</Link>
          <Link className={linkClass} href="/#questions">{t('FAQs')}</Link>
        </div>
        <div>
          <h3 className="mb-5 text-[13px] font-medium leading-[15.6px] max-m:mb-3.5">{t('Let’s connect')}</h3>
          <a className="mb-[13px] block text-[19px] leading-[28.5px] text-champagne no-underline max-m:text-[21px] max-m:leading-[31.5px]" href={`tel:${settings.site_phone_intl}`}>
            <FaPhone aria-hidden="true" className={icon} /> <span dir="ltr">{settings.site_phone}</span>
          </a>
          <a className={linkClass} href={`https://wa.me/${settings.site_whatsapp}`} target="_blank" rel="noopener">
            <FaWhatsapp aria-hidden="true" className={icon} /> {t('Chat on WhatsApp')}
          </a>
          <p className="mb-4 text-xs leading-[21.6px] text-[#c1cdd6]"><FaLocationDot aria-hidden="true" className={icon} /> {t(settings.site_location)}</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-5 border-t border-white/13 py-5 text-[10px] leading-[15px] text-[#c2d0da] max-m:flex-wrap max-m:gap-[18px]">
        <span><FaHeart aria-hidden="true" className="me-[7px] inline-block text-[#dab660]" /> {t('Shared values')}</span>
        <span><FaPeopleRoof aria-hidden="true" className="me-[7px] inline-block text-[#dab660]" /> {t('Family involvement')}</span>
        <span><FaComments aria-hidden="true" className="me-[7px] inline-block text-[#dab660]" /> {t('Personal conversations')}</span>
        <Urdu keep as="span" className="text-[15px] leading-[33px] text-[#deca9c] max-m:text-base max-m:leading-[35.2px]">رشتے محبت کے، فیصلے اپنوں کے</Urdu>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-5 border-t border-white/14 py-[22px] text-[10px] leading-[15px] text-[#bac8d3] max-m:flex-col max-m:items-start max-m:gap-[15px] max-m:pb-[76px] max-m:pt-5">
        <span>© {t('Al Zaujain International Marriage Consultancy')} · <Link href="/privacy" className="text-inherit no-underline hover:text-champagne">{t('Privacy')}</Link> · <Link href="/terms" className="text-inherit no-underline hover:text-champagne">{t('Terms')}</Link></span>
        <span>{t('Designed & developed by')} <a href="https://softisense.com" target="_blank" rel="noopener" className="font-semibold text-champagne no-underline">Softisense.com ↗</a></span>
        <a href="#top" className="text-inherit no-underline">{t('Back to top')} ↑</a>
      </div>
    </footer>
  );
}
