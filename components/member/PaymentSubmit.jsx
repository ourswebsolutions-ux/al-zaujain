'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBuildingColumns, FaCheck } from 'react-icons/fa6';
import { CopyRow } from './PaymentBits';
import { Card } from './Ui';
import { useT } from '@/components/i18n/LanguageProvider';
import { Button } from '@/components/ui/Button';
import { Field, inputClass, labelClass } from '@/components/ui/Form';

export function PaymentSubmit({ methods, price }) {
  const t = useT();
  const router = useRouter();
  const [methodId, setMethodId] = useState(methods[0]?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const method = methods.find((item) => item.id === methodId);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    form.set('method_id', methodId);
    try {
      const response = await fetch('/api/payments', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message);
        return;
      }
      router.push('/dashboard/payments');
      router.refresh();
    } catch {
      setMessage('We could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-6 max-p:grid-cols-1">
      <div className="grid min-w-0 gap-6">
        <Card title="1. Choose how you will pay">
          {price && <p className="mb-3 rounded-lg bg-[var(--d-gold-bg,#fcf4e1)] px-3 py-2 text-[13px] font-medium text-[var(--d-gold,#806126)]">{t('Amount to pay: {price}', { price })}</p>}
          <ul className="grid gap-2">
            {methods.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => setMethodId(item.id)} aria-pressed={item.id === methodId} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors ${item.id === methodId ? 'border-navy bg-[var(--d-tint,#062b4e0a)]' : 'border-[var(--d-line,#e7e9ee)] hover:border-[var(--d-line,#c3c9d3)]'}`}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-cream text-[var(--d-gold,#a67b2e)]"><FaBuildingColumns aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-navy">{item.name}</span><span className="block truncate text-xs text-muted">{item.bank_name}</span></span>
                  {item.id === methodId && <FaCheck aria-hidden="true" className="text-[var(--d-green,#1f8a3a)]" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {method && (
          <Card title="2. Send your payment to this account">
            <CopyRow label="Account title" value={method.account_holder} />
            <CopyRow label="IBAN" value={method.iban} />
            <CopyRow label="Account number" value={method.account_number} />
            {method.instructions && <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-muted">{method.instructions}</p>}
            {method.qr_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/media/payments/${method.qr_image}`} alt={t('Payment QR code')} className="mx-auto mt-4 max-h-56 rounded-lg" />
            )}
          </Card>
        )}
      </div>
      <Card title="3. Tell us about your payment">
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Sender name" name="sender_name" required maxLength={120} hint="The name on the account you paid from." />
          <Field label="Transaction ID" name="transaction_id" required maxLength={80} dir="ltr" />
          <Field label="Amount paid" name="amount" required inputMode="decimal" dir="ltr" placeholder="5000" />
          <label className={labelClass}>
            {t('Payment screenshot or receipt')}
            <input type="file" name="receipt" required accept="image/jpeg,image/png,image/webp" className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy`} />
            <span className="mt-1 block font-normal text-muted">{t('JPG, PNG or WebP, up to 8 MB.')}</span>
          </label>
          {message && <p role="alert" className="border-l-[3px] border-[#a33a2c] bg-[var(--d-red-bg,#fbeeec)] p-3 text-xs">{t(message)}</p>}
          <Button type="submit" tone="gold" disabled={busy || !method} className="cursor-pointer">{t(busy ? 'Sending…' : 'Submit payment')}</Button>
          <p className="text-xs leading-5 text-muted">{t('Our team checks every payment. Your access unlocks once it is approved.')}</p>
        </form>
      </Card>
    </div>
  );
}
