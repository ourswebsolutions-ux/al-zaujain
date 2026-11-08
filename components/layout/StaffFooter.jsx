'use client';

import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { useT } from '@/components/i18n/LanguageProvider';

export function StaffFooter({ name }) {
  const t = useT();
  return (
    <>
      <p className="truncate px-3 pb-2 text-xs text-[#c1cdd6]">{name}</p>
      <Link href="/" className="block rounded-lg px-3 py-2 text-[13px] text-[#e0e6eb] no-underline hover:bg-white/8">{t('Visit website')}</Link>
      <form action={logout}><button type="submit" className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] text-[#e0e6eb] hover:bg-white/8">{t('Sign out')}</button></form>
    </>
  );
}
