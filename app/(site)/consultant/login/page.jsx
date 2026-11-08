import Link from 'next/link';
import { AuthCard } from '@/components/forms/AuthCard';
import { LoginForm } from '@/components/forms/LoginForm';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Consultant login', robots: { index: false } };

export default async function ConsultantLogin() {
  const t = await getT();
  return (
    <AuthCard title={t('Consultant login')} text={t('For Al Zaujain marriage consultants.')} footer={<Link href="/forgot-password" className="font-semibold text-navy">{t('Forgot password?')}</Link>}>
      <LoginForm portal="consultant" next="/consultant" />
    </AuthCard>
  );
}
