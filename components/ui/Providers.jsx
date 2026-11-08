'use client';

import { MotionConfig } from 'framer-motion';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { UnlockProvider } from '@/components/payments/UnlockProvider';

export function Providers({ lang, photoLocked, signedIn, children }) {
  return (
    <LanguageProvider lang={lang}>
      <MotionConfig reducedMotion="user"><UnlockProvider photoLocked={photoLocked} signedIn={signedIn}>{children}</UnlockProvider></MotionConfig>
    </LanguageProvider>
  );
}
