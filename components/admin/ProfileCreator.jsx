'use client';

import { useState } from 'react';
import { FaCircleCheck, FaPaste, FaPenToSquare, FaWandMagicSparkles } from 'react-icons/fa6';
import { ProfileWizard } from '@/components/forms/ProfileWizard';
import { useT } from '@/components/i18n/LanguageProvider';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Form';

const TABS = [
  { key: 'paste', icon: FaPaste, label: 'Paste biodata', text: 'Quick profile import' },
  { key: 'manual', icon: FaPenToSquare, label: 'Fill in manually', text: 'Complete profile form' },
];

export function ProfileCreator({ countries, castes }) {
  const t = useT();
  const [tab, setTab] = useState('paste');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);

  const read = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/profiles/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message);
        return;
      }
      setResult(data);
      setRound((value) => value + 1);
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const filled = result ? Object.values(result.values).filter((value) => value !== null && value !== '').length : 0;

  return (
    <div className="grid gap-6">
      <div role="tablist" aria-label={t('How to add the profile')} className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
        {TABS.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors ${tab === item.key ? 'border-navy bg-white shadow-[0_10px_28px_#03223f12]' : 'border-transparent bg-white/60 hover:border-[var(--d-line,#dfe2e8)]'}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-lg ${tab === item.key ? 'bg-navy text-champagne' : 'bg-cream text-[var(--d-gold,#a67b2e)]'}`}><item.icon aria-hidden="true" /></span>
            <span><span className="block text-[15px] font-bold text-navy">{t(item.label)}</span><span className="block text-xs text-muted">{t(item.text)}</span></span>
          </button>
        ))}
      </div>

      {tab === 'paste' ? (
        <>
          <section className="rounded-[20px] border border-line bg-white p-[30px] shadow-[0_12px_35px_#03223f08] max-m:p-5">
            <label htmlFor="biodata" className="mb-1 block text-[15px] font-bold text-navy">{t('Paste the complete biodata')}</label>
            <p className="mb-3 text-xs leading-5 text-muted">{t('Copy it from WhatsApp, Word, a PDF or anywhere else. Urdu and English both work. Nothing is saved until you review it and press Save.')}</p>
            <textarea id="biodata" value={text} onChange={(event) => setText(event.target.value)} rows={14} dir="auto" placeholder={'Name: …\nAge: …\nCity: …'} className={`${inputClass} font-mono text-[13px] leading-6`} />
            {error && <p role="alert" className="mt-3 border-l-[3px] border-[#a33a2c] bg-[#fbeeec] p-3 text-xs">{t(error)}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Button type="button" tone="gold" disabled={busy || !text.trim()} onClick={read} className="cursor-pointer"><FaWandMagicSparkles aria-hidden="true" /> {t(busy ? 'Reading…' : 'Read biodata')}</Button>
              {result && (
                <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--d-green,#1f8a3a)]">
                  <FaCircleCheck aria-hidden="true" /> {t('{count} details filled in.', { count: filled })}
                  {result.unassigned.length > 0 && <span className="font-normal text-muted">{t('{count} kept as unassigned information.', { count: result.unassigned.length })}</span>}
                </p>
              )}
            </div>
          </section>
          {result && (
            <>
              <p className="text-[13px] font-semibold text-navy">{t('Check every section below, correct anything that needs it, then save.')}</p>
              <ProfileWizard key={round} countries={countries} castes={castes} initial={result.values} admin={{ type: 'paid', hash: result.hash, duplicates: result.duplicates, extra: result.unassigned.join('\n') }} />
            </>
          )}
        </>
      ) : (
        <ProfileWizard key="manual" countries={countries} castes={castes} admin={{ type: 'paid' }} />
      )}
    </div>
  );
}
