'use client';

import { FaCircleCheck } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

export function VerifiedBadge({ className = '' }) {
  const t = useT();
  return (
    <span title={t('Verified profile')} className={`inline-flex align-middle text-verified ${className}`}>
      <FaCircleCheck aria-hidden="true" />
      <span className="sr-only">{t('Verified profile')}</span>
    </span>
  );
}
