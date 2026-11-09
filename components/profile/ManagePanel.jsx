import Link from 'next/link';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import { ProfileActions } from './ProfileActions';
import { StatusPanel } from './StatusPanel';
import { deleteOwnProfile } from '@/app/actions/profile';
import { Button, ButtonLink } from '@/components/ui/Button';
import { getT } from '@/lib/i18n/server.js';

export async function ManagePanel({ profile, actions, editHref, token, children }) {
  const t = await getT();
  return (
    <div className="grid gap-6">
      <StatusPanel profile={profile} />
      {children}
      <section className="rounded-2xl border border-[#e7e9ee] bg-white p-6 shadow-[0_10px_28px_#03223f08] max-m:p-5">
        <h2 className="mb-1 text-[15px] font-semibold text-navy">{t('Copy or download your biodata')}</h2>
        <p className="mb-4 text-xs text-muted">{t('These copies include your private details, so share them carefully.')}</p>
        <ProfileActions {...actions} />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href={editHref}><FaPenToSquare aria-hidden="true" /> {t('Edit profile')}</ButtonLink>
        {profile.status === 'approved' && <ButtonLink tone="outline" href={`/profile/${actions.code}`}>{t('View public page')}</ButtonLink>}
        <details className="group ms-auto text-end">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[#a33a2c]"><FaTrash aria-hidden="true" /> {t('Delete profile')}</summary>
          <form action={deleteOwnProfile} className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <input type="hidden" name="code" value={actions.code} />
            {token && <input type="hidden" name="token" value={token} />}
            <span className="text-xs text-muted">{t('This also removes its photos and CNIC.')}</span>
            <Button type="submit" tone="danger" size="sm" className="cursor-pointer">{t('Yes, delete permanently')}</Button>
          </form>
        </details>
      </div>
    </div>
  );
}
