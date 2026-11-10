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
      <Field label={t('WhatsApp number')} name="whatsapp" type="tel" defaultValue={consultant.whatsapp ?? ''} placeholder="0300 1234567" hint={t('Any format: 0300 1234567, +92 300 1234567 or an overseas number with its country code.')} />
      <Field label={t('Languages')} name="languages" defaultValue={consultant.languages ?? ''} />
      <Field label={t('Photograph')} name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      <label className={labelClass}>{t('Biography')}<textarea name="bio" rows={5} maxLength={2000} defaultValue={consultant.bio ?? ''} className={inputClass} /></label>
      <Submit className="w-fit cursor-pointer">{t('Save')}</Submit>
    </ActionForm>
  );
}
