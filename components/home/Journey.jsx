import { FaArrowRight, FaClipboardList, FaComments, FaPeopleRoof } from 'react-icons/fa6';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { headingQuicksand, SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

const STEPS = [
  { icon: FaClipboardList, title: 'Share your preferences', ur: 'اپنی ترجیحات بتائیں', text: 'Tell us about yourself or your family member, and what matters in a life partner.' },
  { icon: FaComments, title: 'Discuss suitable proposals', ur: 'مناسب رشتوں پر بات کریں', text: 'Explore potential matches with our team and discuss your family’s expectations.' },
  { icon: FaPeopleRoof, title: 'Connect with the family', ur: 'خاندان سے رابطہ کریں', text: 'When both sides are interested, take the next step with a family conversation.' },
];

export async function Journey() {
  const t = await getT();
  return (
    <section id="how-it-works" className="scroll-mt-[15px] bg-mist px-[6%] py-[85px] font-quicksand max-b:px-[5%] max-b:py-[60px] max-m:px-[6%] max-m:py-[43px]">
      <Reveal className="mb-[42px] grid grid-cols-[1.2fr_1fr] items-center gap-[60px] max-b:gap-[30px] max-m:mb-[30px] max-m:grid-cols-1 max-m:gap-6">
        <div>
          <SectionTag>{t('YOUR RISHTA JOURNEY')}</SectionTag>
          <h2 className={`mb-5 ${headingQuicksand}`}>{t('From a first conversation')}<br />{t('to a family connection.')}</h2>
          <p className="mb-4 text-[13px] leading-[24.7px] text-muted max-m:text-xs max-m:leading-[22.8px]">{t('Three thoughtful steps, with your family by your side.')}</p>
        </div>
        <div lang="ur" dir="rtl" className="border-e-[3px] border-gold pe-7 text-end max-m:pe-[18px] ur:invisible">
          <h3 className="mb-2.5 mt-2 font-urdu text-[26px] font-bold leading-[54.6px] max-m:text-[23px] max-m:leading-[48.3px]">پہلی بات سے،<br />دو خاندانوں کے ساتھ تک</h3>
        </div>
      </Reveal>

      <div className="relative grid grid-cols-3 gap-[45px] pt-2 before:absolute before:inset-x-[25px] before:top-[33px] before:h-px before:bg-line before:content-[''] max-b:gap-[25px] max-m:grid-cols-1 max-m:gap-7 max-m:ps-[3px] max-m:before:inset-x-auto max-m:before:bottom-5 max-m:before:start-[27px] max-m:before:top-5 max-m:before:h-auto max-m:before:w-px">
        {STEPS.map((step, index) => (
          <Reveal as="article" y={22} key={step.title} className="relative max-m:ps-[66px]">
            <span className="relative mb-6 grid size-[54px] place-items-center rounded-full border-[7px] border-white bg-navy text-[13px] leading-[19.5px] text-champagne max-m:absolute max-m:start-0 max-m:top-0">0{index + 1}</span>
            <step.icon aria-hidden="true" className="absolute end-1.5 top-[11px] text-[25px] text-[#bd9343] max-m:hidden" />
            <h3 className="mb-1.5 text-lg font-bold leading-[26.1px] max-b:leading-[23.2px] max-m:mb-2.5 max-m:text-[17px] max-m:leading-[24.65px]">{t(step.title)}</h3>
            <Urdu as="h4" className="mb-5 text-start text-[19px] leading-[41.8px] text-[#997127] max-b:leading-[35.2px] max-m:mb-4 max-m:text-[17px] max-m:leading-[37.4px]">{step.ur}</Urdu>
            <p className="mb-4 text-xs leading-[22.8px] text-muted">{t(step.text)}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-[33px] flex items-center justify-between rounded-[10px] bg-navy px-[30px] py-[23px] text-white max-m:flex-col max-m:items-start max-m:gap-5 max-m:p-[22px]">
        <strong className="text-base font-medium">{t('Every step, together.')}</strong>
        <ButtonLink tone="gold" href="/#contact">{t('Talk to our team')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></ButtonLink>
      </div>
    </section>
  );
}
