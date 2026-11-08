import Link from 'next/link';
import { AuthCard } from '@/components/forms/AuthCard';
import { ForgotForm } from '@/components/forms/PasswordForms';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Forgot password', robots: { index: false } };

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <AuthCard title={t('Forgot your password?')} text={t('Enter your email and we will send a reset link.')} footer={<Link href="/login" className="font-semibold text-navy">{t('Back to sign in')}</Link>}>
      <ForgotForm />
    </AuthCard>
  );
}
