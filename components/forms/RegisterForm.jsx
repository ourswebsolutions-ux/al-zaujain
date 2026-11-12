'use client';

import { useActionState, useEffect, useState } from 'react';
import { FaArrowsRotate, FaCheck, FaCopy, FaEye, FaEyeSlash, FaPenToSquare } from 'react-icons/fa6';
import { register } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { inputClass, KeepForm, labelClass, Notice, useFormPending } from '@/components/ui/Form';
import { useT } from '@/components/i18n/LanguageProvider';

const LETTERS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';

// Created in this browser, so the password never travels in a server response.
function generatePassword(length = 16) {
  const all = LETTERS + DIGITS + SYMBOLS;
  const pick = (set) => {
    const limit = 256 - (256 % set.length);
    const byte = new Uint8Array(1);
    do crypto.getRandomValues(byte); while (byte[0] >= limit);
    return set[byte[0] % set.length];
  };
  const chars = [pick(LETTERS), pick(DIGITS), pick(SYMBOLS), ...Array.from({ length: length - 3 }, () => pick(all))];
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = Number(pick('0123456789')) % (index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join('');
}

function SubmitButton() {
  const t = useT();
  const pending = useFormPending();
  return <Button type="submit" disabled={pending} className="w-full cursor-pointer">{t(pending ? 'Creating your account…' : 'Create my account')}</Button>;
}

const iconButton = 'grid size-9 cursor-pointer place-items-center rounded-lg text-sm text-navy transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-gold';

export function RegisterForm({ claim }) {
  const t = useT();
  const [state, action] = useActionState(register, null);
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [password, setPassword] = useState('');
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => setPassword(generatePassword()), []);

  const field = (name) => ({ name, value: values[name], onChange: (event) => setValues({ ...values, [name]: event.target.value }), className: inputClass, required: true });

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <KeepForm action={action} state={state} className="grid gap-4">
      <Notice state={state} />
      {claim && <input type="hidden" name="claim" value={claim} />}
      <label className={labelClass}>{t('Your name')}<input autoComplete="name" maxLength={100} {...field('name')} /></label>
      <label className={labelClass}>{t('Email')}<input type="email" autoComplete="email" {...field('email')} /></label>
      <label className={labelClass}>{t('Phone / WhatsApp')}<input type="tel" autoComplete="tel" placeholder="0300 1234567" {...field('phone')} /></label>

      <div className="rounded-xl border border-[#ddcfb1] bg-[#f8f4eb] p-4">
        <label htmlFor="password" className={labelClass}>{t('Your password')}</label>
        <div className="mt-2 flex items-center gap-1 rounded-[7px] border border-[#dce0dc] bg-white pe-1 focus-within:border-gold">
          <input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            value={password}
            readOnly={!editing}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            spellCheck={false}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-[7px] bg-transparent p-[13px] font-mono text-[13px] text-navy focus:outline-none"
          />
          <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} className={iconButton}>{visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}</button>
          <button type="button" onClick={copy} aria-label={t('Copy password')} className={iconButton}>{copied ? <FaCheck aria-hidden="true" className="text-[#3d6b4a]" /> : <FaCopy aria-hidden="true" />}</button>
        </div>
        <p role="status" className="mt-2 text-[11px] leading-[18px] text-muted">{t(copied ? 'Password copied.' : 'We made a strong password for you. Save it somewhere safe, or choose your own.')}</p>
        <div className="mt-2 flex gap-4 text-[11px] font-semibold text-navy">
          <button type="button" onClick={() => { setPassword(generatePassword()); setEditing(false); setVisible(true); }} className="flex cursor-pointer items-center gap-1.5 hover:text-[#9b712b]"><FaArrowsRotate aria-hidden="true" /> {t('New password')}</button>
          <button type="button" onClick={() => { setEditing(true); document.getElementById('password').focus(); }} className="flex cursor-pointer items-center gap-1.5 hover:text-[#9b712b]"><FaPenToSquare aria-hidden="true" /> {t('Use my own')}</button>
        </div>
      </div>
      <SubmitButton />
    </KeepForm>
  );
}
