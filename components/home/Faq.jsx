import { FaWhatsapp } from 'react-icons/fa6';
import { FaqList } from './FaqList';
import { Reveal } from '@/components/ui/Reveal';
import { headingNunito, SectionTag } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

export async function Faq({ faqs, whatsapp }) {
  const t = await getT();
  return (
    <section id="questions" className="grid scroll-mt-[15px] grid-cols-[1fr_1.5fr] gap-[7%] border-t border-[#e4dac7] bg-paper px-[6%] py-[90px] font-nunito text-navy max-b:py-[60px] max-t:grid-cols-1 max-t:gap-[35px]">
      <Reveal as="header" x={-14} className="mb-9 h-fit max-w-[620px] rounded-[0_20px_20px_0] border-l-4 border-gold bg-cream p-[30px]">
        <SectionTag>{t('A LITTLE CLARITY, BEFORE YOU BEGIN')}</SectionTag>
        <h2 className={headingNunito}>{t('Your questions.')}<br />{t('Let’s talk about them.')}</h2>
        <p className="mb-4 text-base leading-[28.8px]">{t('Every family’s journey is different. Here’s a place to start.')}</p>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="mt-4 inline-block text-[15px] font-extrabold leading-[22.5px] text-navy no-underline">
          <FaWhatsapp aria-hidden="true" className="inline-block" /> {t('Have another question? Talk to us')} ↗
        </a>
      </Reveal>
      <Reveal x={14}><FaqList faqs={faqs} /></Reveal>
    </section>
  );
}
