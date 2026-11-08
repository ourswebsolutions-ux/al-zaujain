'use client';

import { forgotPassword, resetPassword } from '@/app/actions/auth';
import { ActionForm, Field, Submit } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

export function ForgotForm() {
  const t = useT();
  return (
    <ActionForm action={forgotPassword}>
      <Field label={t('Email')} name="email" type="email" autoComplete="email" required />
      <Submit className="w-full cursor-pointer">{t('Send reset link')}</Submit>
    </ActionForm>
  );
}

export function ResetForm({ token }) {
  const t = useT();
  return (
    <ActionForm action={resetPassword}>
      <input type="hidden" name="token" value={token} />
      <Field label={t('New password')} name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label={t('Confirm new password')} name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <Submit className="w-full cursor-pointer">{t('Change password')}</Submit>
    </ActionForm>
  );
}
