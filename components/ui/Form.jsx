'use client';

import { inputClass, labelClass } from './styles';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from './Button';
import { useT } from '@/components/i18n/LanguageProvider';


export function Field({ label, hint, error, className = '', ...props }) {
  const t = useT();
  return (
    <label className={`${labelClass} ${className}`}>
      {t(label)}
      <input className={inputClass} aria-invalid={!!error} {...props} />
      {hint && <span className="mt-1 block font-normal text-muted">{t(hint)}</span>}
      {error && <span className="mt-1 block font-medium text-[var(--d-red,#a33a2c)]">{t(error)}</span>}
    </label>
  );
}

export function Submit({ children, pendingLabel = 'Please wait…', ...props }) {
  const t = useT();
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} {...props}>{pending ? t(pendingLabel) : children}</Button>;
}

export function Notice({ state }) {
  const t = useT();
  if (!state?.message) return null;
  return (
    <p role="status" className={`my-3 border-s-[3px] p-3 text-xs leading-5 ${state.ok ? 'border-[#588465] bg-[var(--d-green-bg,#eef4ef)]' : 'border-[#a33a2c] bg-[var(--d-red-bg,#fbeeec)]'}`}>{t(state.message, state)}</p>
  );
}

// A form bound to a Server Action that returns { ok, message }.
export function ActionForm({ action, className = 'grid gap-4', children }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      <Notice state={state} />
      {children}
    </form>
  );
}

export { inputClass, labelClass };
