'use client';

import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { useT } from '@/components/i18n/LanguageProvider';

export function StaffFooter({ name }) {
  const t = useT();
  return (
    <>
      <p className="truncate px-3 pb-2 text-xs text-muted">{name}</p>
      <Link href="/" className="block rounded-lg px-3 py-2 text-[13px] text-[#3d4a5a] no-underline hover:bg-[#f6f1e6] hover:text-navy">{t('Visit website')}</Link>
      <form action={logout}><button type="submit" className="w-full cursor-pointer rounded-lg px-3 py-2 text-start text-[13px] text-[#3d4a5a] hover:bg-[#f6f1e6] hover:text-navy">{t('Sign out')}</button></form>
    </>
  );
}
