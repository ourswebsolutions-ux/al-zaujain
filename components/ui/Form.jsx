'use client';

import { inputClass, labelClass } from './styles';
import { createContext, useActionState, useContext, useEffect, useRef, useTransition } from 'react';
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
  const status = useFormStatus();
  const pending = status.pending || useContext(PendingContext);
  return <Button type="submit" disabled={pending} {...props}>{pending ? t(pendingLabel) : children}</Button>;
}

export function Notice({ state }) {
  const t = useT();
  if (!state?.message) return null;
  return (
    <p role="status" className={`my-3 border-s-[3px] p-3 text-xs leading-5 ${state.ok ? 'border-[#588465] bg-[var(--d-green-bg,#eef4ef)]' : 'border-[#a33a2c] bg-[var(--d-red-bg,#fbeeec)]'}`}>{t(state.message, state)}</p>
  );
}

const PendingContext = createContext(false);

// True while the surrounding form is being sent (works for KeepForm and plain form actions).
export function useFormPending() {
  const status = useFormStatus();
  return status.pending || useContext(PendingContext);
}

/**
 * A form that sends its fields to a form action WITHOUT clearing them. React clears every field of a
 * <form action> after each submission, even when the server answers with an error: one wrong field
 * then emptied the whole form. Here the fields stay as typed (files included) until the action
 * succeeds and `resetOnSuccess` is set. Without JavaScript it still submits normally.
 */
export function KeepForm({ action, state = null, resetOnSuccess = false, className, children, ...props }) {
  const [pending, startTransition] = useTransition();
  const form = useRef(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) form.current?.reset();
  }, [state, resetOnSuccess]);
  const onSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget, event.nativeEvent.submitter ?? undefined);
    startTransition(() => action(data));
  };
  return (
    <PendingContext value={pending}>
      <form ref={form} action={action} onSubmit={onSubmit} className={className} {...props}>{children}</form>
    </PendingContext>
  );
}

// A form bound to a Server Action that returns { ok, message }. What the person typed is kept when the
// server finds a problem; only a successful "create" form (resetOnSuccess) starts empty again.
export function ActionForm({ action, className = 'grid gap-4', resetOnSuccess = false, children }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <KeepForm action={formAction} state={state} resetOnSuccess={resetOnSuccess} className={className}>
      <Notice state={state} />
      {children}
    </KeepForm>
  );
}

export { inputClass, labelClass };
