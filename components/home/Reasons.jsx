import { FaComments, FaHeart, FaPeopleRoof } from 'react-icons/fa6';
import { Reveal } from '@/components/ui/Reveal';
import { headingNunito, SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

const REASONS = [
  { icon: FaPeopleRoof, title: 'Family, at the heart', text: 'Bring your family into the conversation, at a pace that feels right for you.', ur: 'اپنی سہولت کے مطابق خاندان کو گفتگو اور فیصلے میں شامل کریں۔' },
  { icon: FaComments, title: 'A real conversation', text: 'Speak to our team about your expectations, questions, and next steps.', ur: 'اپنی توقعات اور سوالات پر ہماری ٹیم سے کھل کر بات کریں۔' },
  { icon: FaHeart, title: 'Values that matter', text: 'Discuss the family values and life goals you hope to share with a partner.', ur: 'ان اقدار اور زندگی کے مقاصد کو اہمیت دیں جو آپ کے لیے معنی رکھتے ہیں۔' },
];

export async function Reasons() {
  const t = await getT();
  return (
    <section id="why-choose" className="scroll-mt-[15px] px-[6%] py-[90px] font-nunito text-navy max-b:py-[60px]">
      <Reveal as="header" x={-16} className="mb-9">
        <SectionTag>{t('WHY AL ZAUJAIN')}</SectionTag>
        <h2 className={headingNunito}>{t('A personal approach.')}<br />{t('A family decision.')}</h2>
        <Urdu className="mb-4 text-2xl leading-[60px] text-[#9b712b] max-m:text-xl max-m:leading-[50px]">آپ کی ترجیحات، آپ کے خاندان کا فیصلہ</Urdu>
        <p className="mb-4 text-base leading-[28.8px]">{t('Premium matchmaking for Pakistan and overseas families, built on understanding what matters to you.')}</p>
      </Reveal>
      <div className="grid grid-cols-3 gap-6 max-t:grid-cols-1">
        {REASONS.map((reason, index) => (
          <Reveal as="article" key={reason.title} y={28} scale={0.94} className="relative rounded-[8px_34px_8px_34px] bg-navy p-[34px] text-white transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_35px_#03223f30] max-[500px]:p-[26px]">
            <span className="mb-[26px] grid size-[60px] place-items-center rounded-full bg-cream text-2xl text-[#a67b2e]"><reason.icon aria-hidden="true" /></span>
            <span className="absolute right-7 top-9 text-[30px] font-extrabold leading-[45px] text-gold-soft">0{index + 1}</span>
            <h3 className="mb-2 text-[23px] font-extrabold leading-[27.6px]">{t(reason.title)}</h3>
            <p className="mb-4 text-base leading-[28.8px] text-[#e3e8ed]">{t(reason.text)}</p>
            <Urdu className="mb-4 text-[17px] leading-[42.5px] text-[#e3e8ed] max-m:text-[15px] max-m:leading-[37.5px]">{reason.ur}</Urdu>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
