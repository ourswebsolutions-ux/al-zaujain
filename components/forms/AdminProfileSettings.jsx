'use client';

import Link from 'next/link';
import { FaCrown, FaLock, FaLockOpen, FaTriangleExclamation } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { inputClass, labelClass } from '@/components/ui/Form';

const TYPES = [
  { value: 'public', icon: FaLockOpen, title: 'Free profile', text: 'Anyone can see everything, including the photo and contact details. No credits are used.' },
  { value: 'paid', icon: FaLock, title: 'Premium profile', text: 'Basic details are public. The photo and contact details unlock with premium credits (or full access). Choose what stays hidden under Restrictions.' },
  { value: 'premium', icon: FaCrown, title: 'Exclusive (via consultant)', text: 'Contact details stay private and credits cannot unlock them; families contact you on WhatsApp.' },
];

// The administrator-only part of the profile form.
export function ProfileTypePicker({ value, onChange, name }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t('Profile type')} className="grid grid-cols-3 gap-3 max-m:grid-cols-1">
      {TYPES.map((type) => {
        const active = value === type.value;
        return (
          <label key={type.value} className={`relative flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-4 transition-colors ${active ? (type.value === 'premium' ? 'border-gold bg-[#fcf4e1]' : 'border-navy bg-[#062b4e08]') : 'border-[var(--d-line,#e7e9ee)] hover:border-[#c3c9d3]'}`}>
            <input type="radio" name={name ?? 'access_type_picker'} value={type.value} checked={active} onChange={() => onChange(type.value)} className="sr-only" />
            <span className="flex items-center gap-2 text-sm font-bold text-navy"><type.icon aria-hidden="true" className={type.value === 'premium' ? 'text-gold' : ''} /> {t(type.title)}</span>
            <span className="text-xs leading-5 text-muted">{t(type.text)}</span>
          </label>
        );
      })}
    </div>
  );
}

export function AdminProfileSettings({ mode, type, onType, publish, onPublish, extra, onExtra, duplicates, confirm, onConfirm }) {
  const t = useT();
  return (
    <section className="grid gap-5 rounded-[20px] border border-line bg-white p-[30px] shadow-[0_12px_35px_#03223f08] max-m:p-5">
      {duplicates.length > 0 && (
        <div role="alert" className="rounded-xl border border-[#e4b653] bg-[#fcf4e1] p-4 text-[13px] text-[#806126]">
          <p className="mb-2 flex items-center gap-2 font-bold"><FaTriangleExclamation aria-hidden="true" /> {t('This may already be on file')}</p>
          <ul className="mb-3 grid gap-1">
            {duplicates.map((item) => <li key={item.code}><Link href={`/admin/profiles/${item.code}`} target="_blank" className="font-semibold text-navy underline">{item.code}</Link> · {item.name} · {t(item.status)}</li>)}
          </ul>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={confirm} onChange={(event) => onConfirm(event.target.checked)} className="accent-navy" /> {t('I have checked. This is a different profile, save it anyway.')}</label>
        </div>
      )}
      <div>
        <p className={`${labelClass} mb-2`}>{t('Profile type')}</p>
        <ProfileTypePicker value={type} onChange={onType} />
      </div>
      {mode === 'create' && (
        <label className="flex items-center gap-2.5 text-[13px] font-semibold text-navy">
          <input type="checkbox" checked={publish} onChange={(event) => onPublish(event.target.checked)} className="size-4 accent-navy" />
          {t('Publish straight away')} <span className="font-normal text-muted">{t('(otherwise it waits in Profiles for review)')}</span>
        </label>
      )}
      <label className={labelClass}>
        {t('Unassigned information')}
        <span className="mt-1 block font-normal text-muted">{t('Anything from the pasted biodata that did not fit a field. Only the team sees this.')}</span>
        <textarea value={extra} onChange={(event) => onExtra(event.target.value)} rows={extra ? 5 : 2} dir="auto" className={inputClass} />
      </label>
    </section>
  );
}
