import Image from 'next/image';
import { FaAddressCard, FaCircleInfo, FaComments, FaFileCircleQuestion, FaFileLines, FaLandmark, FaPeopleRoof } from 'react-icons/fa6';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { headingQuicksand, SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-[15px] border-b border-line py-3.5 max-m:items-start max-m:gap-2.5">
      <dt className="text-[11px] font-medium leading-[16.5px] max-m:text-[10px] max-m:leading-[15px]"><Icon aria-hidden="true" className="me-[7px] inline-block text-[#a17a33]" /> {label}</dt>
      <dd className="whitespace-nowrap rounded-[5px] bg-[#fcf4e1] px-[9px] py-1.5 text-[10px] leading-[15px] text-[#806126] max-m:px-1.5 max-m:py-[5px] max-m:text-[8px] max-m:leading-3">{value}</dd>
    </div>
  );
}

const VALUES = [[FaAddressCard, 'Know your consultancy'], [FaComments, 'Ask your questions'], [FaPeopleRoof, 'Decide as a family']];

export async function Registration({ settings }) {
  const t = await getT();
  const whatsapp = `https://wa.me/${settings.site_whatsapp}`;
  return (
    <section id="registration" className="grid scroll-mt-[15px] grid-cols-[1fr_1.05fr] items-center gap-x-[65px] gap-y-[35px] bg-white px-[6%] py-[85px] font-quicksand max-p:gap-[30px] max-b:grid-cols-2 max-b:px-[5%] max-b:py-[60px] max-m:grid-cols-1 max-m:gap-[27px] max-m:px-[6%] max-m:py-[43px]">
      <Reveal x={-22} className="col-start-2 row-start-1 max-m:col-auto max-m:row-auto">
        <SectionTag>{t('AL ZAUJAIN · BUSINESS & REGISTRATION')}</SectionTag>
        <h2 className={`mb-5 ${headingQuicksand}`}>{t('A clear identity.')}<br />{t('A confident beginning.')}</h2>
        <p className="mb-4 text-[13px] leading-[24.7px] text-muted">{t('Choosing a matrimonial consultancy is an important family decision. Get to know Al Zaujain, speak to our team, and ask about the business details before you begin.')}</p>
        <div className="mt-[27px] flex flex-wrap items-center gap-5">
          <ButtonLink external href={whatsapp} size="md" className="max-m:p-[13px] max-m:text-[10px] max-m:leading-[15px]"><FaFileCircleQuestion aria-hidden="true" /> {t('Request registration details')}</ButtonLink>
          <a href={`tel:${settings.site_phone_intl}`} className="border-b border-navy pb-[5px] text-xs font-semibold leading-[18px] text-navy no-underline">{t('Speak to our team')} ↗</a>
        </div>
      </Reveal>

      <Reveal x={22} className="col-start-1 row-start-1 rounded-[26px_6px_26px_6px] border border-[#ddcfb1] bg-[#f8f4eb] p-[30px] shadow-[0_12px_35px_#03223f08] max-p:p-6 max-m:col-auto max-m:row-auto max-m:p-[22px]">
        <div className="flex items-center gap-[23px] border-b border-line pb-6 max-m:gap-[15px] max-m:pb-5">
          <Image src="/images/pakistan-emblem.svg" alt={t('State emblem of Pakistan, shown for reference only')} width={70} height={80} className="h-20 w-[70px] object-contain" />
          <div>
            <span className="mb-2 block text-[9px] leading-[13.5px] tracking-[2px] text-[#406347]">{t('PAKISTAN')}</span>
            <h3 className="mb-1.5 text-lg font-bold leading-[26.1px] max-m:text-[15px] max-m:leading-[21.75px]">{t('Government registration')}</h3>
          </div>
        </div>
        <div className="mb-4 mt-[23px] flex items-center gap-[15px]">
          <Image src="/images/logo.png" alt={t('Al Zaujain logo')} width={48} height={48} className="size-12 rounded-full bg-white" />
          <div>
            <strong className="block text-[22px] font-bold leading-[33px] max-m:text-xl max-m:leading-[30px]">{t('Al Zaujain')}</strong>
            <span className="block text-[10px] leading-[15px] text-muted max-m:text-[9px] max-m:leading-[13.5px]">{t('International Marriage Consultancy · Multan, Pakistan')}</span>
          </div>
        </div>
        <dl className="mb-[18px]">
          <Detail icon={FaLandmark} label={t('Registration authority')} value={t(settings.registration_authority)} />
          <Detail icon={FaFileLines} label={t('Registration number')} value={t(settings.registration_number)} />
        </dl>
        <div className="flex items-start gap-2.5 rounded-[7px] bg-[#f6f7f7] p-[13px]">
          <FaCircleInfo aria-hidden="true" className="mt-[3px] shrink-0 text-[13px] text-[#647e92]" />
          <p className="text-[9px] leading-[15.3px] text-muted">
            {t(settings.registration_note)}
            <Urdu as="span" className="mt-1.5 block text-[10px] leading-[22px]">تصدیق ابھی باقی ہے۔ یہ نشان سرکاری منظوری کی تصدیق نہیں ہے۔</Urdu>
          </p>
        </div>
      </Reveal>

      <div className="col-span-2 grid grid-cols-3 rounded-[10px] border border-[#dcd1bd] bg-white/45 max-m:col-auto max-m:grid-cols-1">
        {VALUES.map(([Icon, text]) => (
          <div key={text} className="flex items-center gap-[17px] border-e border-[#dcd1bd] px-[25px] py-5 text-[13px] font-medium leading-[19.5px] last:border-0 max-b:gap-3 max-b:p-4 max-m:gap-5 max-m:border-b max-m:border-e-0 max-m:px-[22px] max-m:py-[18px]">
            <Icon aria-hidden="true" className="shrink-0 text-[27px] text-[#aa812f] max-b:text-[22px]" />
            <span>{t(text)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
