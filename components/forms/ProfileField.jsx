'use client';

import { FaLock } from 'react-icons/fa6';
import { inputClass, labelClass } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { MARRIAGE_LOCATIONS, NATIONALITIES } from '@/lib/profile-schema.js';

const URDU_SCRIPT = /[\u0600-\u06FF]/;

export function FieldControl({ field, value, onChange, error, countries = [], cities = [], castes = [] }) {
  const t = useT();
  const common = { id: field.name, name: field.name, value: value ?? '', 'aria-invalid': !!error, onChange: (event) => onChange(field.name, event.target.value), className: inputClass };
  // Searchable lists: the id stays on the typing box, so the field label still points at it.
  const searchable = { id: field.name, name: field.name, value: value ?? '', onChange: (next) => onChange(field.name, next), invalid: !!error, className: 'mt-2', inputClassName: inputClass };
  switch (field.type) {
    case 'textarea':
      return <textarea rows={field.rows ?? 3} maxLength={field.max} dir={field.dir} {...common} className={`${inputClass} ${URDU_SCRIPT.test(value ?? '') ? 'font-urdu text-base leading-[2.4]' : ''}`} />;
    case 'select':
      // Choose from the list or type your own; only gender and height must be one of the list.
      if (!field.strict && !field.numeric) {
        const options = field.options.map((option) => {
          const [optionValue, label] = Array.isArray(option) ? option : [option, option];
          return { value: optionValue, label: t(label) };
        });
        return <SearchSelect {...searchable} options={options} allowCustom maxLength={80} placeholder="Choose, or type your own" />;
      }
      return (
        <select {...common}>
          <option value="">{t('Select…')}</option>
          {field.options.map((option) => {
            const [optionValue, label] = Array.isArray(option) ? option : [option, option];
            return <option key={optionValue} value={optionValue}>{t(label)}</option>;
          })}
        </select>
      );
    case 'country':
    case 'country-name': {
      const options = countries.map((country) => ({ value: field.type === 'country' ? country.id : country.name, label: t(country.name) }));
      return <SearchSelect {...searchable} options={options} allowCustom maxLength={100} placeholder="Choose, or type your country" />;
    }
    case 'date':
      return <input type="date" {...common} />;
    case 'email':
      return <input type="email" autoComplete="email" maxLength={field.max} {...common} />;
    case 'number':
      return <input type="number" min={field.min} max={field.max} inputMode="numeric" {...common} />;
    default: {
      const list = {
        cities: cities.map((city) => ({ value: city, label: t(city) })),
        castes,
        nationalities: NATIONALITIES.filter((value) => value !== 'Other').map((value) => ({ value, label: t(value) })),
        'marriage-places': [...new Set([...MARRIAGE_LOCATIONS, ...countries.map((country) => country.name)])].map((value) => ({ value, label: t(value) })),
      }[field.suggest];
      if (list) return <SearchSelect {...searchable} options={list} allowCustom maxLength={field.max} placeholder={field.placeholder ?? 'Type or choose'} />;
      return <input type={field.pattern === 'phone' ? 'tel' : 'text'} dir={field.dir} maxLength={field.max} placeholder={t(field.placeholder)} {...common} />;
    }
  }
}

export function FieldRow({ field, value, onChange, error, countries, cities, castes }) {
  const t = useT();
  return (
    <div className={field.type === 'textarea' || field.wide ? 'col-span-2 max-m:col-auto' : ''}>
      <label htmlFor={field.name} className={labelClass}>
        {t(field.label)}{field.required && <span className="text-[#a33a2c]"> *</span>}
        {field.private && <FaLock aria-label={t('Private')} className="ms-1.5 inline-block text-[9px] text-muted" />}
      </label>
      <FieldControl field={field} value={value} onChange={onChange} error={error} countries={countries} cities={cities} castes={castes} />
      {field.hint && <p className="mt-1 text-[11px] text-muted">{t(field.hint)}</p>}
      {error && <p role="alert" className="mt-1 text-[11px] font-medium text-[#a33a2c]">{t(error)}</p>}
    </div>
  );
}
