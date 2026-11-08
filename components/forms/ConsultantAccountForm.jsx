'use client';

import { saveOwnProfile } from '@/app/actions/consultant';
import { ActionForm, Field, inputClass, labelClass, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

export function ConsultantAccountForm({ consultant }) {
  const t = useT();
  return (
    <ActionForm action={saveOwnProfile}>
      <Field label={t('Title')} name="title" defaultValue={consultant.title ?? ''} />
      <Field label={t('City')} name="city" defaultValue={consultant.city ?? ''} />
      <Field label={t('Phone')} name="phone" defaultValue={consultant.phone ?? ''} />
      <Field label={t('WhatsApp (digits, international format)')} name="whatsapp" defaultValue={consultant.whatsapp ?? ''} />
      <Field label={t('Languages')} name="languages" defaultValue={consultant.languages ?? ''} />
      <Field label={t('Photograph')} name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      <label className={labelClass}>{t('Biography')}<textarea name="bio" rows={5} maxLength={2000} defaultValue={consultant.bio ?? ''} className={inputClass} /></label>
      <Submit className="w-fit cursor-pointer">{t('Save')}</Submit>
    </ActionForm>
  );
}
