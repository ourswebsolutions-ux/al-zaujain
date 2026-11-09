'use client';

import { MotionConfig } from 'framer-motion';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { UnlockProvider } from '@/components/payments/UnlockProvider';

export function Providers({ lang, photoLocked, signedIn, member = false, unlockCost = 1, unlocked = [], children }) {
  return (
    <LanguageProvider lang={lang}>
      <MotionConfig reducedMotion="user"><UnlockProvider photoLocked={photoLocked} signedIn={signedIn} member={member} unlockCost={unlockCost} unlocked={unlocked}>{children}</UnlockProvider></MotionConfig>
    </LanguageProvider>
  );
}
