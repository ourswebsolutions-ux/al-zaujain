import Link from 'next/link';
import { AuthCard } from '@/components/forms/AuthCard';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Create an account', description: 'Register with Al Zaujain to manage your profile, matches and messages.' };

export default async function RegisterPage({ searchParams }) {
  const t = await getT();
  const { claim } = await searchParams;
  return (
    <AuthCard
      title={t('Join Al Zaujain')}
      text={t('Your account is ready in seconds. We create a strong password for you.')}
      footer={<>{t('Already registered?')} <Link href="/login" className="font-semibold text-navy">{t('Sign in')}</Link><br /><Link href="/submit-profile" className="mt-2 inline-block text-navy">{t('Submit a profile without an account')}</Link></>}
    >
      <RegisterForm claim={typeof claim === 'string' ? claim : undefined} />
    </AuthCard>
  );
}
