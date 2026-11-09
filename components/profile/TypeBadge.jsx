'use client';

import { FaCrown, FaLock, FaLockOpen } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const STYLES = {
  premium: { icon: FaLock, label: 'Exclusive', className: 'bg-navy text-champagne' },
  public: { icon: FaLockOpen, label: 'Free', className: 'bg-[#eaf5ee] text-[#1f6b3a]' },
  paid: { icon: FaCrown, label: 'Premium', className: 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark shadow-[0_4px_14px_#c9943255]' },
};

// Shows a profile's access type: Free, Premium (unlocks with credits) or Exclusive (via a consultant).
export function TypeBadge({ type = 'paid', className = '' }) {
  const t = useT();
  const style = STYLES[type] ?? STYLES.paid;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase leading-[15px] tracking-[.6px] ${style.className} ${className}`}>
      <style.icon aria-hidden="true" className="text-[9px]" /> {t(style.label)}
    </span>
  );
}
