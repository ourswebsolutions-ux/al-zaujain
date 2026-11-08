'use client';

import { useMemo, useState } from 'react';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { useT } from '@/components/i18n/LanguageProvider';

// Country and city together: once a country is chosen, only its cities are offered.
// `cities` is [{ name, country }]. Any city may still be typed, for places not yet in the list.
export function PlaceFields({ countries, cities, defaultCountry = '', defaultCity = '', labelClassName, inputClassName, fieldClassName = 'mt-2', showCountry = true }) {
  const t = useT();
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity] = useState(defaultCity);

  // Without a country box (a one-country page), the cities still belong to that country.
  const scoped = showCountry ? country : countries.length === 1 ? countries[0] : '';
  const cityOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const item of cities) {
      if (scoped && item.country !== scoped) continue;
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      list.push({ value: item.name, label: t(item.name), alt: scoped ? undefined : t(item.country) });
    }
    return list;
  }, [cities, scoped, t]);

  const chooseCountry = (next) => {
    setCountry(next);
    if (next && city && !cities.some((item) => item.name === city && item.country === next)) setCity('');
  };

  return (
    <>
      {showCountry && (
        <label className={labelClassName}>
          {t('Country')}
          <SearchSelect name="country" value={country} onChange={chooseCountry} options={countries} translate anyLabel="Any country" placeholder="Any country" className={fieldClassName} inputClassName={inputClassName} />
        </label>
      )}
      <label className={labelClassName}>
        {t('City')}
        <SearchSelect name="city" value={city} onChange={setCity} options={cityOptions} allowCustom anyLabel="Any city" placeholder={scoped ? 'Type or choose a city' : 'Any city'} className={fieldClassName} inputClassName={inputClassName} />
      </label>
    </>
  );
}
