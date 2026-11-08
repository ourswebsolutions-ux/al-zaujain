import Link from 'next/link';
import { AuthCard } from '@/components/forms/AuthCard';
import { LoginForm } from '@/components/forms/LoginForm';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Sign in', robots: { index: false } };

const NOTICES = { 'password-reset': 'Your password has been changed. Please sign in.', 'link-expired': 'That link has expired. Please sign in and request a new one.' };

export default async function LoginPage({ searchParams }) {
  const t = await getT();
  const { next, notice } = await searchParams;
  return (
    <AuthCard
      title={t('Welcome back')}
      text={t('Sign in to manage your profile, matches and messages.')}
      footer={<><Link href="/forgot-password" className="font-semibold text-navy">{t('Forgot password?')}</Link> {t('· New here?')} <Link href="/register" className="font-semibold text-navy">{t('Create an account')}</Link><br /><Link href="/consultant/login" className="mt-2 inline-block text-navy">{t('Marriage consultant login')}</Link></>}
    >
      {NOTICES[notice] && <p className="mb-3 rounded-md bg-[#eef4ef] p-3 text-xs">{NOTICES[notice]}</p>}
      <LoginForm next={next} />
    </AuthCard>
  );
}
