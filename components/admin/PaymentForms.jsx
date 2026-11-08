'use client';

import { saveMethod, saveRestrictions } from '@/app/actions/payments';
import { Switch } from './Ui';
import { useT } from '@/components/i18n/LanguageProvider';
import { ActionForm, Field, inputClass, labelClass, Submit } from '@/components/ui/Form';

export function MethodForm({ method }) {
  const t = useT();
  const value = (key) => method?.[key] ?? '';
  return (
    <ActionForm action={saveMethod} className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
      {method && <input type="hidden" name="id" value={method.id} />}
      <Field label="Payment Method Name" name="name" defaultValue={value('name')} required placeholder={t('e.g. Meezan Bank')} />
      <Field label="Bank / Service Name" name="bank_name" defaultValue={value('bank_name')} required placeholder={t('e.g. EasyPaisa')} />
      <Field label="Account Holder Name" name="account_holder" defaultValue={value('account_holder')} required />
      <Field label="Account Number" name="account_number" defaultValue={value('account_number')} dir="ltr" />
      <div className="col-span-2 max-m:col-auto"><Field label="IBAN Number" name="iban" defaultValue={value('iban')} dir="ltr" /></div>
      <label className={`${labelClass} col-span-2 max-m:col-auto`}>{t('Additional Payment Instructions')}<textarea name="instructions" rows={3} defaultValue={value('instructions')} className={inputClass} /></label>
      <Field label="QR code or payment image (optional)" name="qr_image" type="file" accept="image/jpeg,image/png,image/webp" />
      {method?.qr_image && <label className="flex items-center gap-2 self-center text-xs"><input type="checkbox" name="remove_qr" className="accent-navy" /> {t('Remove the current image')}</label>}
      <div className="col-span-2 border-y border-[var(--d-line,#eef0f3)] max-m:col-auto"><Switch name="active" defaultChecked={method ? method.active : true} label="Active" text="Only active methods are shown to users." /></div>
      <div className="col-span-2 max-m:col-auto"><Submit className="cursor-pointer">{t('Save payment method')}</Submit></div>
    </ActionForm>
  );
}

export function RestrictionsForm({ items, values, price, days }) {
  const t = useT();
  return (
    <ActionForm action={saveRestrictions}>
      <div className="divide-y divide-[var(--d-line,#eef0f3)]">
        {items.map((item) => <Switch key={item.key} name={item.key} defaultChecked={values[item.key]} label={item.label} text={item.text} />)}
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-[var(--d-line,#eef0f3)] pt-5 max-m:grid-cols-1">
        <Field label="Price shown to users" name="access_price" defaultValue={price} placeholder={t('e.g. Rs 5,000')} />
        <Field label="Access length in days" name="access_days" type="number" min="0" max="3650" defaultValue={days} hint="0 means access does not expire." />
      </div>
      <Submit className="w-fit cursor-pointer">{t('Save restrictions')}</Submit>
    </ActionForm>
  );
}
