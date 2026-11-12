import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/forms/AuthCard';
import { VerifyEmailForm } from '@/components/forms/VerifyEmailForm';
import { requireUser } from '@/lib/auth.js';
import { isEmailVerified } from '@/lib/email-verification.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confirm your email', robots: { index: false } };

export default async function VerifyEmailPage() {
  const user = await requireUser('/verify-email');
  if (user.role !== 'user' || (await isEmailVerified(user.id))) redirect('/dashboard');
  const t = await getT();
  return (
    <AuthCard title={t('Confirm your email')} text={t('We sent a 6-digit code to {email}. Enter it below to confirm your email address.', { email: user.email })}>
      <VerifyEmailForm />
    </AuthCard>
  );
}
