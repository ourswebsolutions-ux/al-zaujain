'use client';

import { changePassword, updateAccount, updateNotifications } from '@/app/actions/auth';
import { ActionForm, Field, inputClass, labelClass, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

export function AccountForms({ user }) {
  const t = useT();
  const panel = 'rounded-2xl border border-[#e7e9ee] bg-white p-6 shadow-[0_10px_28px_#03223f08]';
  const title = 'mb-3 text-[15px] font-semibold text-navy';
  return (
    <div className="grid gap-6">
      <section className={panel}>
        <h2 className={title}>{t('Your details')}</h2>
        <ActionForm action={updateAccount}>
          <Field label={t('Name')} name="name" defaultValue={user.name} required />
          <Field label={t('Phone')} name="phone" type="tel" defaultValue={user.phone ?? ''} />
          <Field label={t('Email')} value={user.email} disabled readOnly />
          <Submit className="w-fit cursor-pointer">{t('Save details')}</Submit>
        </ActionForm>
      </section>
      <section className={panel}>
        <h2 className={title}>{t('Notifications and privacy')}</h2>
        <ActionForm action={updateNotifications}>
          <label className={labelClass}>
            Email me new matches
            <select name="match_frequency" defaultValue={user.match_emails ? user.match_frequency : 'off'} className={inputClass}>
              <option value="daily">{t('Daily')}</option>
              <option value="weekly">{t('Weekly')}</option>
              <option value="off">{t('Never')}</option>
            </select>
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-5">
            <input type="checkbox" name="show_in_views" defaultChecked={user.show_in_views} className="mt-1 accent-navy" />
            Show my profile to members whose profiles I visit. Turn this off to appear only as “A member”.
          </label>
          <Submit className="w-fit cursor-pointer">{t('Save preferences')}</Submit>
        </ActionForm>
      </section>
      <section className={panel}>
        <h2 className={title}>{t('Change password')}</h2>
        <ActionForm action={changePassword}>
          <Field label={t('Current password')} name="current" type="password" autoComplete="current-password" required />
          <Field label={t('New password')} name="password" type="password" autoComplete="new-password" required minLength={8} />
          <Submit className="w-fit cursor-pointer">{t('Change password')}</Submit>
        </ActionForm>
      </section>
    </div>
  );
}
