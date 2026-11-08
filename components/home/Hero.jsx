import Image from 'next/image';
import Link from 'next/link';
import { Arrow, ButtonLink, buttonClass } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

const AGE_OPTIONS = [['', 'Any adult age'], ['18-25', '18–25'], ['26-30', '26–30'], ['31-35', '31–35'], ['36-45', '36–45'], ['46-99', '46 and above']];

const label = 'block text-[11px] font-bold leading-[16.5px] text-navy max-m:text-[10px] max-m:leading-[15px]';
const control = 'mt-1.5 block h-[43px] w-full rounded-md border border-[#dee2e6] bg-white pl-3 pr-3 text-xs font-normal leading-[18px] text-ink max-m:h-auto max-m:py-2.5 max-m:pl-[9px] max-m:text-[11px] max-m:leading-[16.5px]';
const selectControl = `${control} pr-8 max-m:pr-[29px] bg-[url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='%23343a40'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='m2%205%206%206%206-6'/%3e%3c/svg%3e")] bg-[length:16px_12px] bg-[position:right_12px_center] bg-no-repeat appearance-none`;

async function HeroCopyBlock({ settings }) {
  const t = await getT();
  return (
    <div className="relative z-10 grow text-white max-m:mb-7">
      <Reveal as="p" y={12} className="mb-[17px] text-[9px] font-bold leading-[13.5px] tracking-[1.6px] text-champagne max-m:text-[8px] max-m:leading-3 max-m:tracking-[1px]">{t(settings.hero_eyebrow)}</Reveal>
      <Reveal as="h1" y={16} className="mb-4 text-[clamp(34px,3.8vw,57px)] font-semibold leading-[1.3] tracking-[-1.5px] max-m:text-[36px]">
        {t(settings.hero_line1)}<br />{t(settings.hero_line2)}<br /><span className="text-gold-soft">{t(settings.hero_highlight)}</span>
      </Reveal>
      <Reveal as="p" y={12} className="mb-[9px] max-w-[380px] text-xs leading-[22.8px] max-m:max-w-[290px] max-m:text-[11px] max-m:leading-[20.9px]">
        {t(settings.hero_sub1)}<br />{t(settings.hero_sub2)}
      </Reveal>
      <Reveal y={12}>
        <Urdu className="mb-5 text-left text-[23px] leading-[51.75px] text-champagne max-m:text-[22px] max-m:leading-[49.5px]">{settings.hero_urdu}</Urdu>
      </Reveal>
      <Reveal y={12}>
        <ButtonLink tone="gold" href="/#contact" className="px-[21px] py-[14px]">{t('Speak to our team')} <Arrow /></ButtonLink>
      </Reveal>
    </div>
  );
}

async function SearchBox({ cities }) {
  const t = await getT();
  return (
    <Reveal y={16} className="relative z-10 w-[340px] shrink-0 rounded-[14px] bg-white p-[27px] shadow-[0_12px_40px_#00152831] max-b:p-[22px] max-m:w-full max-m:p-[23px]">
      <span className="mb-2.5 block text-[8px] font-semibold leading-3 tracking-[1px] text-[#916b29]">{t('BISMILLAH. LET’S BEGIN.')}</span>
      <h3 className="mb-[7px] text-[21px] font-semibold leading-[25.2px] tracking-[-0.6px] max-b:text-[19px] max-b:leading-[22.8px]">{t('Find your life partner')}</h3>
      <p className="mb-[19px] text-[10px] leading-[15px] text-muted">
        {t('A few preferences. A thoughtful start.')}{' '}
        <Link href="/proposals#filters" className="font-semibold text-[#916b29] underline underline-offset-2">{t('Advanced search')}</Link>
      </p>
      <form action="/proposals" className="grid items-end gap-[13px] max-m:gap-3" aria-label={t('Find a rishta')}>
        <label className={label}>
          {t('Name, caste or profession')}
          <input name="q" type="search" maxLength={80} placeholder={t('e.g. Jutt, Doctor, Ayesha')} className={control} />
        </label>
        <label className={label}>
          {t('Looking for')}
          <select name="gender" defaultValue="female" className={selectControl}>
            <option value="female">{t('Bride')}</option>
            <option value="male">{t('Groom')}</option>
          </select>
        </label>
        <label className={label}>
          {t('Age range')}
          <select name="age" className={selectControl}>
            {AGE_OPTIONS.map(([value, text]) => <option key={value} value={value}>{t(text)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t('Preferred city')}
          <select name="city" className={selectControl}>
            <option value="">{t('Any city')}</option>
            {cities.map((city) => <option key={city} value={city}>{t(city)}</option>)}
            <option value="overseas">{t('Overseas')}</option>
          </select>
        </label>
        <button type="submit" className={buttonClass('deepGold', 'lg', 'mt-[7px] min-h-[43px] cursor-pointer px-4! py-2.5! text-xs! leading-[18px]! max-m:gap-1.5 max-m:text-[11px]! max-m:leading-[16.5px]!')}>
          {t('Search rishtay')} <Arrow />
        </button>
      </form>
    </Reveal>
  );
}

const BENEFITS = ['Share your preferences', 'Involve your family', 'Begin a conversation'];

export async function Hero({ settings, cities }) {
  const t = await getT();
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="relative flex min-h-[540px] items-center justify-between gap-10 px-[4.5%] py-12 min-[1450px]:py-[65px] max-b:min-h-0 max-b:gap-[25px] max-b:px-[4%] max-b:py-[35px] max-m:block max-m:px-[6%] max-m:py-8">
        <Image src="/images/pakistani-couple.png" alt="" fill priority sizes="100vw" className="object-cover object-[60%_39%] max-m:object-[74%_0%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#03223ff7,#03223fb8_40%,#03223f2b_72%,#03223f6b)] max-m:bg-[#03223f55] max-m:bg-[linear-gradient(90deg,#03223fed,#03223f80),linear-gradient(0deg,#03223f_48%,transparent)]" />
        <HeroCopyBlock settings={settings} />
        <SearchBox cities={cities} />
      </div>
      <div className="flex justify-around gap-[15px] bg-cream px-[3%] py-[23px] text-[11px] leading-[16.5px] max-b:gap-2.5 max-b:text-[9px] max-b:leading-[13.5px] max-m:block max-m:px-[6%] max-m:py-4 max-m:text-[10px] max-m:leading-[15px]">
        {BENEFITS.map((benefit, index) => (
          <span key={benefit} className="max-m:mb-2.5 max-m:block">
            <b className="mr-2.5 inline-grid size-7 place-items-center rounded-full bg-[#eadbb8] text-[10px] font-medium leading-[15px] text-[#7c5919] max-b:mr-[5px] max-m:size-6 max-m:text-[9px]">0{index + 1}</b>
            {t(benefit)}
          </span>
        ))}
      </div>
    </div>
  );
}
