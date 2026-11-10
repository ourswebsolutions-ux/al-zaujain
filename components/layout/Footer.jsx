import Image from 'next/image';
import Link from 'next/link';
import { FaBullhorn, FaEnvelope, FaLocationDot, FaPhone, FaWhatsapp } from 'react-icons/fa6';
import { Urdu } from '@/components/ui/Text';
import { WHATSAPP_CHANNEL } from '@/lib/content.js';
import { getFees } from '@/lib/fees.js';
import { getT } from '@/lib/i18n/server.js';

const heading = 'mb-5 text-[14px] font-bold uppercase tracking-[1.5px] text-navy max-sm:mb-3';
const linkClass = 'mb-3 block w-fit text-[15px] font-medium text-[#525252] no-underline transition-colors hover:text-[#a17a33]';
const social = 'grid size-10 place-items-center rounded-full bg-navy text-[17px] text-white no-underline transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#a17a33] hover:text-white';

// The site footer: a light panel with the brand, the site's links, legal pages and every way to reach
// the bureau. The contact column is the "Contact us" destination in the menu.
export async function Footer({ settings }) {
  const t = await getT();
  const fees = await getFees();
  const whatsapp = `https://wa.me/${settings.site_whatsapp}`;
  const email = fees.email;
  return (
    <footer className="border-t border-[#062b4e14] bg-[linear-gradient(180deg,#fbf7ef,#f6efe2)] px-[5%] pb-5 pt-12 font-sans max-m:pb-[76px] text-[#525252] shadow-[0_-10px_20px_#062b4e0a] max-sm:px-4 max-sm:pt-9">
      <div className="mx-auto w-full max-w-[1296px]">
        <div className="mb-10 text-center max-sm:mb-8">
          <p className="bg-[linear-gradient(135deg,#062b4e_30%,#c99432_100%)] bg-clip-text text-[30px] font-semibold leading-snug text-transparent [-webkit-text-fill-color:transparent] max-sm:text-[21px]">{t('Rishtay built on love, decisions made with family.')}</p>
          <Urdu keep as="p" className="mt-1 text-[20px] leading-[2] text-[#a17a33] max-sm:text-[17px]">رشتے محبت کے، فیصلے اپنوں کے</Urdu>
        </div>

        <div className="grid grid-cols-[1.3fr_.8fr_.8fr_1.2fr] gap-10 max-b:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-8">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-3 no-underline">
              <Image src="/images/logo.png" alt="" width={64} height={64} className="size-16 rounded-full bg-white" />
              <span className="block text-[22px] font-bold leading-tight tracking-[0.5px] text-navy">
                AL ZAUJAIN
                <small className="mt-1 block text-[10px] font-semibold tracking-[0.3px] text-[#876623]">{t('International Marriage Consultancy')}</small>
              </span>
            </Link>
            <p className="mb-5 max-w-[380px] text-[15px] leading-[1.75]">{t(settings.footer_about)}</p>
            <div className="flex flex-wrap gap-2.5">
              <a href={whatsapp} target="_blank" rel="noopener" aria-label={t('Chat on WhatsApp')} className={social}><FaWhatsapp aria-hidden="true" /></a>
              <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener" aria-label={t('Official WhatsApp Channel')} className={social}><FaBullhorn aria-hidden="true" /></a>
              <a href={`tel:${settings.site_phone_intl}`} aria-label={t('Call us')} className={social}><FaPhone aria-hidden="true" /></a>
              {email && <a href={`mailto:${email}`} aria-label={t('Email us')} className={social}><FaEnvelope aria-hidden="true" /></a>}
            </div>
          </div>

          <div>
            <h3 className={heading}>{t('Company')}</h3>
            <Link className={linkClass} href="/proposals">{t('Browse proposals')}</Link>
            <Link className={linkClass} href="/consultants">{t('Marriage consultants')}</Link>
            <Link className={linkClass} href="/submit-profile">{t('Submit a profile')}</Link>
            <Link className={linkClass} href="/#registration">{t('Registration information')}</Link>
            <Link className={linkClass} href="/#android-app">{t('Android app')}</Link>
          </div>

          <div>
            <h3 className={heading}>{t('Policies')}</h3>
            <Link className={linkClass} href="/fees">{t('Consultancy fees')}</Link>
            <Link className={linkClass} href="/privacy">{t('Privacy policy')}</Link>
            <Link className={linkClass} href="/terms">{t('Terms of use')}</Link>
            <Link className={linkClass} href="/login">{t('Member login')}</Link>
            <Link className={linkClass} href="/register">{t('Register')}</Link>
          </div>

          <div id="contact" className="scroll-mt-[90px]">
            <h3 className={heading}>{t('Contact us')}</h3>
            <p className="mb-3 flex gap-2.5 text-[15px] leading-6"><FaLocationDot aria-hidden="true" className="mt-1 shrink-0 text-[#a17a33]" /> <span><strong className="font-semibold text-navy">{t('Head office')}:</strong> {t(settings.site_location)}</span></p>
            <a href={`tel:${settings.site_phone_intl}`} className="mb-3 flex items-center gap-2.5 text-[16px] font-semibold text-navy no-underline hover:text-[#a17a33]"><FaPhone aria-hidden="true" className="shrink-0 text-[#a17a33]" /> <span dir="ltr">{settings.site_phone}</span></a>
            <a href={whatsapp} target="_blank" rel="noopener" className="mb-3 flex items-center gap-2.5 text-[15px] font-medium text-[#14703a] no-underline hover:text-[#0d5c2d]"><FaWhatsapp aria-hidden="true" className="shrink-0" /> {t('Chat on WhatsApp')}</a>
            {email && <a href={`mailto:${email}`} className="mb-3 flex items-center gap-2.5 break-all text-[15px] font-medium text-navy no-underline hover:text-[#a17a33]"><FaEnvelope aria-hidden="true" className="shrink-0 text-[#a17a33]" /> {email}</a>}
          </div>
        </div>

        <div className="mt-9 grid grid-cols-[auto_1fr] items-center gap-x-8 gap-y-3 border-y border-[#062b4e1f] px-3 py-4 max-sm:grid-cols-1 max-sm:text-center">
          <p className="text-[17px] font-semibold text-navy">{t('Helpline')}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 max-sm:justify-center">
            <a href={`tel:${settings.site_phone_intl}`} className="text-[17px] font-semibold text-[#a17a33] no-underline" dir="ltr"><FaPhone aria-hidden="true" className="me-1.5 inline-block text-[13px]" /> {settings.site_phone}</a>
            {fees.ntn && <span className="text-[14px] font-medium text-[#525252]">{t(fees.ntn)}</span>}
          </div>
        </div>

        <div className="pt-5 text-center text-[13.5px] leading-6">
          <p>{t('We declare that Al Zaujain is not a dating website. It is strictly for matrimonial purposes only.')}</p>
          <p className="mt-2">© {new Date().getFullYear()} {t('Al Zaujain International Marriage Consultancy')} · {t('All rights reserved.')}</p>
          <p className="mt-1">{t('Designed & developed by')} <a href="https://softisense.com" target="_blank" rel="noopener" className="font-semibold text-[#a17a33] no-underline">Softisense.com ↗</a> · <a href="#top" className="text-inherit no-underline hover:text-navy">{t('Back to top')} ↑</a></p>
        </div>
      </div>
    </footer>
  );
}
