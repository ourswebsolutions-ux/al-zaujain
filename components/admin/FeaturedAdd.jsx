'use client';

import { addFeaturedByCode } from '@/app/actions/admin';
import { inputSm } from './Ui';
import { ActionForm, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

export function FeaturedAdd() {
  const t = useT();
  return (
    <ActionForm action={addFeaturedByCode} className="flex flex-wrap items-center gap-2">
      <input name="code" required aria-label={t('Profile code')} placeholder={t('Profile code, e.g. AZ-07')} className={inputSm} />
      <Submit size="sm" className="cursor-pointer">{t('Add')}</Submit>
    </ActionForm>
  );
}
