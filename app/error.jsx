'use client';

import { useT } from '@/components/i18n/LanguageProvider';
export default function ErrorPage({ reset }) {
  const t = useT();
  return (
    <main className="grid min-h-dvh place-items-center bg-cream p-8 text-center">
      <div>
        <h1 className="font-quicksand text-3xl font-bold text-navy">{t('Something went wrong')}</h1>
        <p className="mt-2 text-sm text-muted">{t('Please try again. If it keeps happening, contact our team.')}</p>
        <button type="button" onClick={reset} className="mt-5 cursor-pointer rounded-[9px] bg-navy px-5 py-3 text-sm font-bold text-white">{t('Try again')}</button>
      </div>
    </main>
  );
}
