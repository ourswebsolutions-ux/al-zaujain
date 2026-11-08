'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createUser, saveUser, setUserPassword } from '@/app/actions/admin';
import { useT } from '@/components/i18n/LanguageProvider';
import { Field, inputClass, labelClass, Notice, Submit } from '@/components/ui/Form';

export function NewUserForm() {
  const t = useT();
  const [state, action] = useActionState(createUser, null);
  const [role, setRole] = useState('user');
  return (
    <form action={action} className="grid grid-cols-2 gap-5 max-m:grid-cols-1">
      <div className="col-span-2 max-m:col-auto"><Notice state={state} /></div>
      <fieldset className="col-span-2 max-m:col-auto">
        <legend className={labelClass}>{t('Account type')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[['user', 'Member', 'Can submit a profile, chat and receive matches.'], ['consultant', 'Consultant', 'Signs in to the consultant dashboard.']].map(([value, label, text]) => (
            <label key={value} className={`cursor-pointer rounded-lg border p-4 transition-colors ${role === value ? 'border-navy bg-[var(--d-tint,#062b4e0a)]' : 'border-[var(--d-line,#dfe2e8)] hover:border-[var(--d-line,#c3c9d3)]'}`}>
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="accent-navy" />
              <span className="ml-2 text-sm font-semibold text-navy">{t(label)}</span>
              <span className="mt-1 block text-xs text-muted">{t(text)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Full name" name="name" required maxLength={100} />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" type="tel" placeholder="0300 1234567" />
      {role === 'consultant' && <Field label="City" name="city" maxLength={80} />}
      <Field label="Password" name="password" type="text" hint="Leave blank to generate one." autoComplete="new-password" />
      <div className="col-span-2 flex items-center gap-4 max-m:col-auto">
        <Submit className="cursor-pointer">{t('Create account')}</Submit>
        {state?.ok && <Link href={`/admin/users/${state.id}`} className="text-[13px] font-semibold text-navy">{t('Open this user')} →</Link>}
      </div>
    </form>
  );
}

export function EditUserForm({ user }) {
  const t = useT();
  const [state, action] = useActionState(saveUser, null);
  return (
    <form action={action} className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
      <div className="col-span-2 empty:hidden max-m:col-auto"><Notice state={state} /></div>
      <input type="hidden" name="id" value={user.id} />
      <Field label="Full name" name="name" defaultValue={user.name} required />
      <Field label="Email" name="email" type="email" defaultValue={user.email} required />
      <Field label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ''} />
      <div className="col-span-2 max-m:col-auto"><Submit className="cursor-pointer">{t('Save changes')}</Submit></div>
    </form>
  );
}

export function PasswordForm({ id }) {
  const t = useT();
  const [state, action] = useActionState(setUserPassword, null);
  return (
    <form action={action} className="grid gap-3">
      <Notice state={state} />
      <input type="hidden" name="id" value={id} />
      <label className={labelClass}>{t('New password')}<input name="password" type="text" autoComplete="new-password" placeholder={t('Leave blank to generate one.')} className={inputClass} /></label>
      <Submit tone="outline" className="w-fit cursor-pointer">{t('Set password')}</Submit>
    </form>
  );
}
