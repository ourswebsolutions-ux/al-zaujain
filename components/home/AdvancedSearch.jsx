import Link from 'next/link';
import { FaArrowRight, FaMagnifyingGlass } from 'react-icons/fa6';
import { PlaceFields } from '@/components/listing/PlaceFields';
import { buttonClass } from '@/components/ui/Button';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';
import { HEIGHTS, OPTIONS } from '@/lib/profile-schema.js';

const POPULAR = [
  ['Jutt Proposals', '/proposals?caste=Jutt'],
  ['Arain Proposals', '/proposals?caste=Arain'],
  ['Rajput Proposals', '/proposals?caste=Rajput'],
  ['Marriage Proposals in Multan', '/proposals?city=Multan'],
  ['Rishtay in Lahore', '/proposals?city=Lahore'],
  ['Rishtay in Karachi', '/proposals?city=Karachi'],
  ['UK Matrimonial Proposals', '/proposals/united-kingdom'],
  ['USA Matrimonial Proposals', '/proposals/united-states'],
  ['Gulf Country Proposals', '/proposals/gulf'],
];

const CATEGORIES = [
  ['Brides', '/proposals?gender=female'],
  ['Grooms', '/proposals?gender=male'],
  ['Doctors', '/proposals?profession=Doctor'],
  ['Engineers', '/proposals?profession=Engineer'],
  ['Overseas Pakistanis', '/proposals?city=overseas'],
  ['Verified profiles', '/proposals?verified=1'],
  ['Divorced / second marriage', '/proposals?marital=Divorced'],
];

const HEIGHT_OPTIONS = HEIGHTS.map(([cm, text]) => [cm, text.split(' (')[0]]);
const AGES = Array.from({ length: 53 }, (_, index) => index + 18);

const check = 'flex cursor-pointer items-center gap-2 text-xs font-semibold text-navy';
const label = 'block text-[11px] font-bold leading-[16.5px] text-navy';
const control = 'mt-1.5 block h-[44px] w-full rounded-lg border border-[#e2ddd2] bg-white px-3 text-[13px] font-normal text-ink transition-colors focus:border-gold focus:outline-none';
const select = `${control} appearance-none bg-[url("data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='%23343a40'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='m2%205%206%206%206-6'/%3e%3c/svg%3e")] bg-[length:14px_10px] bg-[position:right_12px_center] bg-no-repeat pe-8`;

// Every field maps to a filter the proposals page already understands, so results come from the database.
export async function AdvancedSearch({ countries, cities, castes, nationalities }) {
  const t = await getT();
  return (
    <section id="search" aria-labelledby="search-title" className="scroll-mt-[15px] bg-[linear-gradient(180deg,#fcfbf8,#f7f2e8)] px-[6%] py-[80px] font-nunito text-navy max-b:py-[56px]">
      <Reveal as="header" y={24} className="mx-auto mb-8 max-w-[1240px]">
        <SectionTag>{t('FIND YOUR MATCH')}</SectionTag>
        <div className="flex items-center justify-between gap-6 max-m:gap-2.5">
          <h2 id="search-title" className="my-3 text-[40px] font-extrabold leading-[1.15] max-b:text-[30px] max-[700px]:text-[clamp(20px,5vw,26px)]">{t('Search matrimonial proposals')}</h2>
          <Urdu className="text-[17px] leading-[42.5px] text-[#9b712b] max-[700px]:text-[clamp(11px,2.8vw,16px)]">اپنا رشتہ تلاش کریں</Urdu>
        </div>
        <p className="text-base leading-7 text-muted max-m:text-sm">{t('Combine as many filters as you like. Only profiles matching all of them are shown.')}</p>
      </Reveal>

      <Reveal y={30} className="mx-auto max-w-[1240px]">
        <form action="/proposals" aria-label={t('Search matrimonial proposals')} className="rounded-[24px] border border-line bg-white p-7 shadow-[0_24px_60px_#03223f12] max-m:p-5">
          <div className="grid grid-cols-5 gap-x-4 gap-y-5 max-p:grid-cols-3 max-m:grid-cols-2">
            <label className={`${label} col-span-2 max-m:col-span-2`}>
              {t('Name or keyword')}
              <input name="q" type="search" maxLength={80} placeholder={t('e.g. Ayesha, Doctor')} className={control} />
            </label>
            <label className={label}>
              {t('Looking for')}
              <select name="gender" defaultValue="" className={select}>
                <option value="">{t('Bride or groom')}</option>
                <option value="female">{t('Bride')}</option>
                <option value="male">{t('Groom')}</option>
              </select>
            </label>
            <div className={label}>
              {t('Age range')}
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <select name="age_min" aria-label={t('Minimum age')} defaultValue="" className={`${select} mt-0! ps-2.5 pe-7 max-m:bg-[position:right_7px_center] max-m:ps-2 max-m:pe-5`}>
                  <option value="">{t('From')}</option>
                  {AGES.map((age) => <option key={age} value={age}>{age}</option>)}
                </select>
                <select name="age_max" aria-label={t('Maximum age')} defaultValue="" className={`${select} mt-0! ps-2.5 pe-7 max-m:bg-[position:right_7px_center] max-m:ps-2 max-m:pe-5`}>
                  <option value="">{t('To')}</option>
                  {AGES.map((age) => <option key={age} value={age}>{age}</option>)}
                </select>
              </div>
            </div>
            <label className={label}>
              {t('Caste / Biradari')}
              <SearchSelect name="caste" options={castes} allowCustom anyLabel="Any caste" placeholder="e.g. Jutt, Arain" maxLength={60} className="mt-1.5" inputClassName={control} />
            </label>
            <PlaceFields countries={countries.map((country) => country.name)} cities={cities} labelClassName={label} inputClassName={control} fieldClassName="mt-1.5" />
            <label className={label}>
              {t('Education')}
              <select name="education" defaultValue="" className={select}>
                <option value="">{t('Any education')}</option>
                {OPTIONS.education_level.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </select>
            </label>
            <label className={label}>
              {t('Profession')}
              <input name="profession" maxLength={80} placeholder={t('e.g. Teacher')} className={control} />
            </label>
            <label className={label}>
              {t('Religion')}
              <select name="religion" defaultValue="" className={select}>
                <option value="">{t('Any religion')}</option>
                {OPTIONS.religion.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </select>
            </label>
            <label className={label}>
              {t('Sect')}
              <select name="sect" defaultValue="" className={select}>
                <option value="">{t('Any sect')}</option>
                {OPTIONS.sect.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </select>
            </label>
            <label className={label}>
              {t('Marital status')}
              <select name="marital" defaultValue="" className={select}>
                <option value="">{t('Any')}</option>
                {OPTIONS.marital_status.map((value) => <option key={value} value={value}>{t(value)}</option>)}
              </select>
            </label>
            <div className={label}>
              {t('Height')}
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <select name="height_min" aria-label={t('Minimum height')} defaultValue="" className={`${select} mt-0! ps-2.5 pe-7 max-m:bg-[position:right_7px_center] max-m:ps-2 max-m:pe-5`}>
                  <option value="">{t('From')}</option>
                  {HEIGHT_OPTIONS.map(([cm, text]) => <option key={cm} value={cm}>{text}</option>)}
                </select>
                <select name="height_max" aria-label={t('Maximum height')} defaultValue="" className={`${select} mt-0! ps-2.5 pe-7 max-m:bg-[position:right_7px_center] max-m:ps-2 max-m:pe-5`}>
                  <option value="">{t('To')}</option>
                  {HEIGHT_OPTIONS.map(([cm, text]) => <option key={cm} value={cm}>{text}</option>)}
                </select>
              </div>
            </div>
            <label className={label}>
              {t('Nationality')}
              <SearchSelect name="nationality" options={nationalities} translate allowCustom anyLabel="Any nationality" placeholder="Any nationality" maxLength={60} className="mt-1.5" inputClassName={control} />
            </label>
            <label className={label}>
              {t('Sort by')}
              <select name="sort" defaultValue="newest" className={select}>
                <option value="newest">{t('Newest first')}</option>
                <option value="verified">{t('Verified first')}</option>
                <option value="age_low">{t('Age: youngest first')}</option>
                <option value="age_high">{t('Age: oldest first')}</option>
              </select>
            </label>
            <div className="col-span-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-5 max-p:col-span-3 max-m:col-span-2">
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <label className={check}><input type="checkbox" name="verified" value="1" className="size-4 accent-navy" /> {t('Verified profiles only')}</label>
                <label className={check}><input type="checkbox" name="photo" value="1" className="size-4 accent-navy" /> {t('With photo only')}</label>
              </div>
              <button type="submit" className={buttonClass('deepGold', 'lg', 'h-[44px] w-[calc(40%-8px)] cursor-pointer py-0! max-p:w-[calc(33.4%-6px)] max-m:w-full')}><FaMagnifyingGlass aria-hidden="true" /> {t('Search proposals')}</button>
            </div>
          </div>
        </form>

        <div className="mt-8 grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-4 max-m:grid-cols-1">
          <p className="pt-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-bronze">{t('Popular searches')}</p>
          <ul className="flex flex-wrap gap-2">
            {POPULAR.map(([text, href]) => (
              <li key={href}><Link href={href} className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-navy no-underline transition-colors hover:border-gold hover:bg-navy hover:text-white">{t(text)} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100 text-[9px] text-gold transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" /></Link></li>
            ))}
          </ul>
          <p className="pt-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-bronze">{t('Browse by category')}</p>
          <ul className="flex flex-wrap gap-2">
            {CATEGORIES.map(([text, href]) => (
              <li key={href}><Link href={href} className="inline-flex rounded-full bg-[#efe6d3] px-3.5 py-2 text-xs font-semibold text-[#6f5220] no-underline transition-colors hover:bg-gold-soft hover:text-dark">{t(text)}</Link></li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
