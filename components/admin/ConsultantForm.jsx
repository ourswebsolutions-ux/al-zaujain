'use client';

import { useState } from 'react';
import { ActionForm, Field, inputClass, labelClass, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

const PERMISSIONS = [
  ['perm_review', 'Can approve and reject assigned profiles'],
  ['perm_edit', 'Can edit assigned profiles'],
  ['perm_contact', 'Can see contact details of assigned profiles'],
  ['perm_chat', 'Can message assigned clients'],
  ['perm_proposals', 'Can create matching proposals'],
];

const AUDIENCE = [
  ['everyone', 'Everyone', 'Listed on the public consultants page for all families.'],
  ['team', 'Consultant team only', 'Hidden from the public. Works only inside the admin and consultant panels.'],
  ['city', 'One city only', 'Shown only to families of the chosen city.'],
];

export function ConsultantForm({ action, consultant, cities = [] }) {
  const t = useT();
  const value = (key) => consultant?.[key] ?? '';
  const [audience, setAudience] = useState(consultant?.audience ?? 'everyone');
  return (
    <ActionForm action={action} className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
      {consultant && <input type="hidden" name="id" value={consultant.id} />}
      <div className="col-span-2 max-m:col-auto"><Field label={t('Name')} name="display_name" defaultValue={value('display_name')} required /></div>
      {!consultant && (
        <>
          <Field label={t('Login email')} name="email" type="email" required />
          <Field label={t('Password')} name="password" type="text" hint={t('Leave blank to generate one.')} />
        </>
      )}
      <Field label={t('Title')} name="title" defaultValue={value('title')} placeholder={t('Senior marriage consultant')} />
      <Field label={t('City')} name="city" defaultValue={value('city')} />
      <Field label={t('Phone')} name="phone" defaultValue={value('phone')} />
      <Field label={t('WhatsApp (digits, international format)')} name="whatsapp" defaultValue={value('whatsapp')} placeholder="923001234567" />
      <Field label={t('Public email')} name="public_email" type="email" defaultValue={value('public_email')} />
      <Field label={t('Languages')} name="languages" defaultValue={value('languages')} />
      <Field label={t('Years of experience')} name="experience_years" type="number" min="0" max="70" defaultValue={value('experience_years')} />
      <Field label={t('Photograph')} name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      <label className={`${labelClass} col-span-2 max-m:col-auto`}>{t('Biography')}<textarea name="bio" rows={4} defaultValue={value('bio')} maxLength={2000} className={inputClass} /></label>
      <fieldset className="col-span-2 grid gap-2 rounded-xl border border-line p-4 max-m:col-auto">
        <legend className="px-1 text-xs font-bold">{t('Who is this consultant for?')}</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-2 max-m:grid-cols-1">
          {AUDIENCE.map(([key, label, text]) => (
            <label key={key} className={`flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-3 text-xs ${audience === key ? 'border-navy bg-[#062b4e08]' : 'border-[var(--d-line,#e7e9ee)]'}`}>
              <span className="flex items-center gap-2 font-semibold text-navy"><input type="radio" name="audience" value={key} checked={audience === key} onChange={() => setAudience(key)} className="accent-navy" /> {t(label)}</span>
              <span className="text-muted">{t(text)}</span>
            </label>
          ))}
        </div>
        {audience === 'city' && (
          <label className={labelClass}>
            {t('City this consultant serves')}
            <input name="audience_city" list="consultant-cities" required maxLength={80} defaultValue={value('audience_city') || value('city')} placeholder={t('e.g. Multan')} className={inputClass} />
            <datalist id="consultant-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist>
          </label>
        )}
      </fieldset>
      <fieldset className="col-span-2 grid grid-cols-2 gap-2 rounded-xl border border-line p-4 max-m:col-auto max-m:grid-cols-1">
        <legend className="px-1 text-xs font-bold">{t('Permissions')}</legend>
        {PERMISSIONS.map(([name, label]) => (
          <label key={name} className="flex items-center gap-2 text-xs">
            <input type="checkbox" name={name} defaultChecked={consultant ? consultant[name] : name !== 'perm_edit'} className="accent-navy" /> {t(label)}
          </label>
        ))}
      </fieldset>
      <div className="col-span-2 max-m:col-auto"><Submit className="cursor-pointer">{t('Save consultant')}</Submit></div>
    </ActionForm>
  );
}
