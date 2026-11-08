import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TemplateForm } from '@/components/admin/SettingsForms';
import { Panel, Title } from '@/components/admin/Ui';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function EditTemplate({ params }) {
  const t = await getT();
  await requireAdmin();
  const template = await getDb().emailTemplate.findUnique({ where: { key: (await params).key } });
  if (!template) notFound();
  return (
    <div className="max-w-[760px]">
      <Link href="/admin/emails" className="text-xs text-navy">{t('← Email notifications')}</Link>
      <Title>{template.name}</Title>
      <Panel><TemplateForm template={template} /></Panel>
    </div>
  );
}
