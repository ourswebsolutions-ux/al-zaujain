import Link from 'next/link';
import { FaChevronDown } from 'react-icons/fa6';
import { PlaceFields } from '@/components/listing/PlaceFields';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { buttonClass } from '@/components/ui/Button';
import { inputClass, labelClass } from '@/components/ui/styles';
import { HEIGHTS, OPTIONS } from '@/lib/profile-schema.js';
import { SORTS } from '@/lib/search.js';
import { getT } from '@/lib/i18n/server.js';

const SHORT_HEIGHTS = HEIGHTS.map(([cm, text]) => [cm, text.split(' (')[0]]);
const MORE = ['education', 'profession', 'marital', 'religion', 'sect', 'nationality', 'heightMin', 'heightMax', 'verified', 'photo'];

async function Select({ label, name, value, options, any }) {
  const t = await getT();
  return (
    <label className={labelClass}>
      {t(label)}
      <select name={name} defaultValue={value ?? ''} className={inputClass}>
        <option value="">{t(any)}</option>
        {options.map((option) => {
          const [optionValue, text] = Array.isArray(option) ? option : [option, option];
          return <option key={optionValue} value={optionValue}>{t(text)}</option>;
        })}
      </select>
    </label>
  );
}

// A plain GET form: filters are shareable links. Country, city, caste and nationality are searchable lists.
export async function FilterPanel({ action, filters, cities, countries, castes, nationalities }) {
  const t = await getT();
  const field = `${inputClass} mt-0!`;
  return (
    <form id="filters" action={action} className="h-fit scroll-mt-5 rounded-[20px] border border-line bg-white p-6">
      <h2 className="mb-4 font-quicksand text-lg font-bold">{t('Search and filter')}</h2>
      {filters.second && <input type="hidden" name="second" value={filters.second} />}
      <div className="grid gap-4">
        <label className={labelClass}>
          {t('Name, caste, city or profession')}
          <input name="q" type="search" maxLength={80} defaultValue={filters.q ?? ''} placeholder={t('e.g. Jutt')} className={inputClass} />
        </label>
        <Select label={t('Looking for')} name="gender" value={filters.gender} any="Bride or groom" options={[['female', 'Bride'], ['male', 'Groom']]} />
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>{t('Age from')}<input name="age_min" type="number" min="18" max="99" defaultValue={filters.ageMin ?? ''} className={inputClass} /></label>
          <label className={labelClass}>{t('Age to')}<input name="age_max" type="number" min="18" max="99" defaultValue={filters.ageMax ?? ''} className={inputClass} /></label>
        </div>
        <PlaceFields countries={countries} cities={cities} showCountry={countries.length > 1} defaultCountry={filters.country ?? ''} defaultCity={filters.city === 'overseas' ? '' : filters.city ?? ''} labelClassName={labelClass} inputClassName={field} />
        <label className={labelClass}>
          {t('Caste / Biradari')}
          <SearchSelect name="caste" defaultValue={filters.caste ?? ''} options={castes} allowCustom anyLabel="Any caste" placeholder="Any caste" maxLength={60} className="mt-2" inputClassName={field} />
        </label>
        <details open={MORE.some((key) => filters[key]) || undefined} className="group rounded-xl border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-navy [&::-webkit-details-marker]:hidden">
            {t('More filters')}
            <FaChevronDown aria-hidden="true" className="text-[10px] text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-line px-4 pb-4 pt-3">
            <Select label={t('Education')} name="education" value={filters.education} any="Any education" options={OPTIONS.education_level} />
            <label className={labelClass}>{t('Profession')}<input name="profession" maxLength={80} defaultValue={filters.profession ?? ''} placeholder={t('Any profession')} className={inputClass} /></label>
            <Select label={t('Marital status')} name="marital" value={filters.marital} any="Any status" options={OPTIONS.marital_status} />
            <Select label={t('Religion')} name="religion" value={filters.religion} any="Any religion" options={OPTIONS.religion} />
            <Select label={t('Sect')} name="sect" value={filters.sect} any="Any sect" options={OPTIONS.sect} />
            <div className="grid grid-cols-2 gap-3">
              <Select label={t('Height from')} name="height_min" value={filters.heightMin} any="Any" options={SHORT_HEIGHTS} />
              <Select label={t('Height to')} name="height_max" value={filters.heightMax} any="Any" options={SHORT_HEIGHTS} />
            </div>
            <label className={labelClass}>
              {t('Nationality')}
              <SearchSelect name="nationality" defaultValue={filters.nationality ?? ''} options={nationalities} translate allowCustom anyLabel="Any nationality" placeholder="Any nationality" maxLength={60} className="mt-2" inputClassName={field} />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" name="verified" value="1" defaultChecked={filters.verified} className="accent-navy" /> {t('Verified profiles only')}</label>
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" name="photo" value="1" defaultChecked={filters.photo} className="accent-navy" /> {t('With photo only')}</label>
          </div>
        </details>
        <Select label={t('Sort by')} name="sort" value={filters.sort} any="Newest first" options={Object.entries(SORTS).filter(([key]) => key !== 'newest').map(([key, sort]) => [key, sort.label])} />
        <button type="submit" className={buttonClass('deepGold', 'lg', 'w-full cursor-pointer')}>{t('Search rishtay')}</button>
        <Link href={action} className="text-center text-xs font-semibold text-navy underline underline-offset-2">{t('Clear filters')}</Link>
      </div>
    </form>
  );
}
