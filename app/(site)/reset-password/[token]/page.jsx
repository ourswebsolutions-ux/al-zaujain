import Link from 'next/link';
import { AuthCard } from '@/components/forms/AuthCard';
import { ResetForm } from '@/components/forms/PasswordForms';
import { peekToken } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPasswordPage({ params }) {
  const t = await getT();
  const { token } = await params;
  if (!(await peekToken(token, 'reset_password'))) {
    return <AuthCard title={t('This link has expired')} text={t('Reset links work once and last one hour.')} footer={<Link href="/forgot-password" className="font-semibold text-navy">{t('Request a new link')}</Link>} />;
  }
  return <AuthCard title={t('Choose a new password')}><ResetForm token={token} /></AuthCard>;
}
