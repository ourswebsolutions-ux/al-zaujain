'use client';

import { login } from '@/app/actions/auth';
import { ActionForm, Field, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

export function LoginForm({ next, portal }) {
  const t = useT();
  return (
    <ActionForm action={login}>
      {next && <input type="hidden" name="next" value={next} />}
      {portal && <input type="hidden" name="portal" value={portal} />}
      <Field label={t('Email')} name="email" type="email" autoComplete="email" required />
      <Field label={t('Password')} name="password" type="password" autoComplete="current-password" required />
      <Submit className="w-full cursor-pointer">{t('Sign in')}</Submit>
    </ActionForm>
  );
}
