'use client';

import { useState, useTransition } from 'react';
import { FieldRow } from './ProfileField';
import { savePartnerRequirements } from '@/app/actions/member';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Form';
import { SECTIONS } from '@/lib/profile-schema.js';
import { useT } from '@/components/i18n/LanguageProvider';

const SECTION = SECTIONS.find((section) => section.key === 'partner');

export function PreferencesForm({ code, initial, countries, castes }) {
  const t = useT();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState(null);
  const [pending, startTransition] = useTransition();

  const submit = (event) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await savePartnerRequirements(code, values);
      setState(result);
      setErrors(result.errors ?? {});
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#e7e9ee] bg-white p-7 shadow-[0_10px_28px_#03223f08] max-m:p-5">
      <div className="grid grid-cols-2 gap-5 max-m:grid-cols-1">
        {SECTION.fields.map((field) => <FieldRow key={field.name} field={field} value={values[field.name]} onChange={(name, value) => setValues({ ...values, [name]: value })} error={errors[field.name]} countries={countries} cities={[]} castes={castes} />)}
      </div>
      <Notice state={state} />
      <Button type="submit" disabled={pending} className="mt-5 cursor-pointer">{t(pending ? 'Saving…' : 'Save partner requirements')}</Button>
    </form>
  );
}
