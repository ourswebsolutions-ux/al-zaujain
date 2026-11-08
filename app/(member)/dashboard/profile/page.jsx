import { redirect } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa6';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { memberProfiles, primaryProfile } from '@/lib/dashboard.js';
import { profileCode } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';

export default async function MyProfilePage() {
  const t = await getT();
  const user = await requireUser('/dashboard/profile');
  const primary = primaryProfile(await memberProfiles(user.id));
  if (primary) redirect(`/dashboard/profiles/${profileCode(primary.id)}`);
  return (
    <>
      <PageHeader title={t('My matrimonial profile')} text={t('Your biodata, its review status, and your copy, image and PDF downloads.')} />
      <EmptyState icon={<FaIdCard aria-hidden="true" />} title={t('You have not created a biodata yet')} text={t('It takes a few minutes, and our team reviews every profile before it goes live.')} action={<ButtonLink tone="gold" href="/dashboard/edit">{t('Create my biodata')}</ButtonLink>} />
    </>
  );
}
