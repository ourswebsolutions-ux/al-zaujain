import Image from 'next/image';
import { FaHeadset, FaLocationDot, FaWhatsapp } from 'react-icons/fa6';
import { ContactForm } from './ContactForm';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

export async function Contact({ settings }) {
  const t = await getT();
  return (
    <section id="contact" className="scroll-mt-[15px] bg-cream px-[6%] py-[85px] font-quicksand max-b:px-[5%] max-b:py-[60px] max-m:px-[6%] max-m:py-[43px]">
      <Reveal duration={0.9} className="relative flex min-h-[340px] overflow-hidden rounded-t-[18px] bg-navy text-white max-m:block max-m:min-h-[530px]">
        <div className="relative z-20 w-[62%] bg-[linear-gradient(90deg,#062b4e_68%,transparent)] p-[38px] max-b:w-[68%] max-m:w-full max-m:bg-[linear-gradient(0deg,#062b4e,transparent)] max-m:p-[27px]">
          <SectionTag className="text-[9px]! leading-[13.5px]! text-champagne!">{t('A RISHTA BEGINS WITH UNDERSTANDING')}</SectionTag>
          <h2 className="mb-5 text-[35px] font-bold leading-[43.75px] tracking-[-1.2px] max-m:text-[31px] max-m:leading-[38.75px] max-m:tracking-[-0.8px]">{t('For your family’s')}<br />{t('beautiful tomorrow.')}</h2>
          <Urdu as="h3" className="mb-[17px] text-left text-[19px] font-bold leading-[27.55px] text-champagne max-m:text-xl max-m:leading-11">آپ کے خاندان کے خوبصورت کل کے لیے</Urdu>
          <p className="text-xs leading-[22.8px] text-[#c6d3dd]">{t('Let’s talk about the person, the values, and the future you have in mind.')}</p>
        </div>
        <Image src="/images/pakistani-couple.png" alt={t('Wedding couple in Pakistani traditional clothing')} width={634} height={340} sizes="50vw" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover object-[77%_50%] max-m:inset-y-auto max-m:left-0 max-m:h-[340px] max-m:w-full max-m:object-[72%_50%] max-m:opacity-25" />
      </Reveal>
      <Reveal duration={0.85} className="grid grid-cols-[1.3fr_.7fr] gap-10 rounded-b-[18px] border border-t-0 border-[#dfd7c7] bg-white p-[35px] max-p:gap-[25px] max-p:p-7 max-b:grid-cols-[1.2fr_.8fr] max-m:grid-cols-1 max-m:p-[25px]">
        <ContactForm />
        <aside className="flex flex-col items-start justify-center border-l border-[#dfd7c7] pl-[35px] max-p:pl-[25px] max-m:border-l-0 max-m:border-t max-m:border-line max-m:pl-0 max-m:pt-[25px]">
          <span className="mb-[22px] grid size-[60px] place-items-center rounded-full bg-[#f6edda] text-[26px] text-[#a87f30]"><FaHeadset aria-hidden="true" /></span>
          <h3 className="mb-2 text-[25px] font-bold leading-[36.25px]">{t('Prefer to speak')}<br />{t('with someone?')}</h3>
          <p className="mb-4 text-[13px] leading-[24.7px] text-muted max-m:text-xs max-m:leading-[22.8px]">{t('We’d be happy to hear your family’s requirements.')}</p>
          <a href={`tel:${settings.site_phone_intl}`} dir="ltr" className="mb-[23px] mt-2.5 text-[23px] font-bold leading-[34.5px] text-navy no-underline max-b:text-lg max-b:leading-[27px] max-m:text-2xl max-m:leading-9">{settings.site_phone}</a>
          <ButtonLink external tone="gold" size="md" href={`https://wa.me/${settings.site_whatsapp}`} className="max-m:px-[17px] max-m:py-3"><FaWhatsapp aria-hidden="true" /> {t('Chat on WhatsApp')}</ButtonLink>
          <span className="mt-6 flex items-center gap-2.5 text-[11px] leading-[16.5px] text-[#667782]"><FaLocationDot aria-hidden="true" /> {t(settings.site_location)}</span>
        </aside>
      </Reveal>
    </section>
  );
}
