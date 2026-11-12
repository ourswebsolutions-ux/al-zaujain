'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { confirmEmail, logout, resendEmailCode } from '@/app/actions/auth';
import { useT } from '@/components/i18n/LanguageProvider';
import { ActionForm, Notice, Submit } from '@/components/ui/Form';
import { inputClass, labelClass } from '@/components/ui/styles';

// The 6-digit code box, "Confirm" and "Send a new code" (with a one-minute wait between codes).
export function VerifyEmailForm() {
  const t = useT();
  const [resent, setResent] = useState(null);
  const [wait, setWait] = useState(0);
  const [sending, startSending] = useTransition();
  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const resend = () => startSending(async () => {
    const result = await resendEmailCode();
    setResent(result);
    if (result.wait) setWait(result.wait);
  });
  return (
    <div className="grid gap-4">
      <ActionForm action={confirmEmail}>
        <label className={labelClass}>
          {t('Confirmation code')}
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} required placeholder="123456" className={`${inputClass} text-center text-2xl font-bold tracking-[10px]`} />
        </label>
        <Submit className="w-full cursor-pointer" pendingLabel="Checking…">{t('Confirm my email')}</Submit>
      </ActionForm>
      <Notice state={resent} />
      <button type="button" onClick={resend} disabled={sending || wait > 0} className="cursor-pointer text-center text-[13px] font-semibold text-navy underline-offset-2 hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline">
        {sending ? t('Sending…') : wait > 0 ? t('Send a new code in {seconds}s', { seconds: wait }) : t('Did not get it? Send a new code')}
      </button>
      <p className="text-center text-[11.5px] leading-5 text-muted">{t('Check your spam folder too. The code expires in 15 minutes.')}</p>
      <form action={logout} className="text-center"><button type="submit" className="cursor-pointer text-[12px] text-muted underline">{t('Sign out')}</button></form>
    </div>
  );
}
