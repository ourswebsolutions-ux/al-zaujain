'use client';

import { useActionState } from 'react';
import { runMatchingNow, saveChatSettings, saveContent, saveMatching, saveSmtp, saveTemplate, sendSmtpTest } from '@/app/actions/admin';
import { ActionForm, Field, inputClass, labelClass, Notice, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

function Check({ name, label, checked }) {
  const t = useT();
  return <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name={name} defaultChecked={checked} className="accent-navy" /> {t(label)}</label>;
}

const WEIGHTS = [['age', 'Age'], ['religion', 'Religion and sect'], ['caste', 'Caste / Biradari'], ['education', 'Education'], ['city', 'City'], ['country', 'Country'], ['preferences', 'Other partner preferences']];

export function MatchingForm({ settings, weights }) {
  const t = useT();
  return (
    <ActionForm action={saveMatching}>
      <Check name="match_enabled" label={t('Send automatic match emails')} checked={settings.match_enabled === '1'} />
      <div className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
        <Field label={t('Minimum match score to email (%)')} name="match_min_score" type="number" min="0" max="100" defaultValue={settings.match_min_score} />
        <Field label={t('Most matches per email')} name="match_max_per_email" type="number" min="1" max="20" defaultValue={settings.match_max_per_email} />
      </div>
      <h3 className="text-sm font-bold">{t('Scoring weights')}</h3>
      <p className="-mt-3 text-xs text-muted">{t('Higher numbers count for more. They do not need to add up to 100.')}</p>
      <div className="grid grid-cols-3 gap-4 max-m:grid-cols-2">
        {WEIGHTS.map(([key, label]) => <Field key={key} label={label} name={`weight_${key}`} type="number" min="0" max="100" defaultValue={weights[key] ?? 0} />)}
      </div>
      <Submit className="w-fit cursor-pointer">{t('Save matching rules')}</Submit>
    </ActionForm>
  );
}

export function RunMatching() {
  const t = useT();
  const [state, action] = useActionState(runMatchingNow, null);
  return (
    <form action={action}>
      <Notice state={state} />
      <Submit tone="gold" pendingLabel={t('Sending…')} className="cursor-pointer">{t('Run matching now')}</Submit>
    </form>
  );
}

export function TemplateForm({ template }) {
  const t = useT();
  return (
    <ActionForm action={saveTemplate}>
      <input type="hidden" name="key" value={template.key} />
      <Check name="enabled" label={t('Send this email')} checked={template.enabled} />
      <Field label={t('Subject')} name="subject" defaultValue={template.subject} required maxLength={200} />
      <label className={labelClass}>{t('Message')}<textarea name="body" rows={12} defaultValue={template.body} required className={`${inputClass} font-mono`} /></label>
      <p className="text-xs text-muted">Variables: {template.variables?.split(', ').map((name) => `{{${name}}}`).join(' ')}. Write a button as [Button text]({'{{link}}'}) on its own line.</p>
      <Submit className="w-fit cursor-pointer">{t('Save template')}</Submit>
    </ActionForm>
  );
}

export function SmtpForm({ values, hasPassword }) {
  const t = useT();
  return (
    <ActionForm action={saveSmtp}>
      <div className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
        <Field label={t('SMTP host')} name="host" defaultValue={values.smtp_host} placeholder={t('smtp.example.com')} />
        <Field label={t('Port')} name="port" type="number" defaultValue={values.smtp_port} placeholder="587" />
        <Field label={t('Username')} name="user" defaultValue={values.smtp_user} autoComplete="off" />
        <Field label={t('Password')} name="password" type="password" autoComplete="new-password" placeholder={hasPassword ? 'Saved. Leave blank to keep it.' : ''} />
      </div>
      <Field label={t('From address')} name="from" defaultValue={values.smtp_from} placeholder={t('Al Zaujain <no-reply@yourdomain.com>')} />
      <Check name="secure" label={t('Use SSL (usually port 465)')} checked={values.smtp_secure === 'true'} />
      {hasPassword && <Check name="clear_password" label={t('Remove the saved password')} />}
      <Submit className="w-fit cursor-pointer">{t('Save SMTP settings')}</Submit>
    </ActionForm>
  );
}

export function SmtpTest() {
  const t = useT();
  return (
    <ActionForm action={sendSmtpTest}>
      <Field label={t('Send a test email to')} name="to" type="email" required />
      <Submit tone="gold" pendingLabel={t('Sending…')} className="w-fit cursor-pointer">{t('Send test email')}</Submit>
    </ActionForm>
  );
}

export function ChatSettingsForm({ settings }) {
  const t = useT();
  return (
    <ActionForm action={saveChatSettings}>
      <Check name="chat_enabled" label={t('Chat is switched on for everyone')} checked={settings.chat_enabled === '1'} />
      <Check name="chat_require_approved" label={t('Members need an approved profile before starting a chat')} checked={settings.chat_require_approved === '1'} />
      <Submit className="w-fit cursor-pointer">{t('Save chat settings')}</Submit>
    </ActionForm>
  );
}

export function ContentForm({ fields, settings }) {
  const t = useT();
  return (
    <ActionForm action={saveContent}>
      {fields.map(([key, label, multiline]) => (multiline ? (
        <label key={key} className={labelClass}>{t(label)}<textarea name={key} rows={3} defaultValue={settings[key]} className={inputClass} /></label>
      ) : (
        <Field key={key} label={label} name={key} defaultValue={settings[key]} />
      )))}
      <Submit className="w-fit cursor-pointer">{t('Save content')}</Submit>
    </ActionForm>
  );
}
