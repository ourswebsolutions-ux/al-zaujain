'use client';

import { useState } from 'react';
import { setProfileType } from '@/app/actions/admin';
import { ProfileTypePicker } from '@/components/forms/AdminProfileSettings';
import { useT } from '@/components/i18n/LanguageProvider';
import { Submit } from '@/components/ui/Form';

export function ProfileTypeForm({ id, type }) {
  const t = useT();
  const [value, setValue] = useState(type);
  return (
    <form action={setProfileType} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="access_type" value={value} />
      <ProfileTypePicker value={value} onChange={setValue} name={`type-${id}`} />
      <Submit size="sm" disabled={value === type} className="w-fit cursor-pointer">{t('Change profile type')}</Submit>
    </form>
  );
}
