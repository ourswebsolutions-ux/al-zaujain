'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { FaComments } from 'react-icons/fa6';
import { startChat } from '@/app/actions/profile';
import { useUnlock } from '@/components/payments/UnlockProvider';
import { Button } from '@/components/ui/Button';
import { useT } from '@/components/i18n/LanguageProvider';

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return <Button type="submit" tone="gold" disabled={pending} className="cursor-pointer"><FaComments aria-hidden="true" /> {t('Chat now')}</Button>;
}

export function ChatButton({ code }) {
  const [state, action] = useActionState(startChat, null);
  const { openUnlock } = useUnlock();
  useEffect(() => { if (state?.upgrade) openUnlock(); }, [state, openUnlock]);
  return (
    <form action={action}>
      <input type="hidden" name="code" value={code} />
      <SubmitButton />
      {state?.message && !state.upgrade && <p role="alert" className="mt-2 max-w-72 text-xs text-[#a33a2c]">{state.message}</p>}
    </form>
  );
}
