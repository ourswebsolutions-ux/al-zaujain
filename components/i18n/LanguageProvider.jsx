'use client';

import { createContext, useContext, useMemo } from 'react';
import { makeT } from '@/lib/i18n/core.js';

const LanguageContext = createContext({ lang: 'en', t: makeT('en') });

export function LanguageProvider({ lang, children }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext).lang;
export const useT = () => useContext(LanguageContext).t;
