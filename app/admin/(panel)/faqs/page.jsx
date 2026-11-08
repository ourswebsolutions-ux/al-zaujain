import { deleteFaq, saveFaq } from '@/app/actions/admin';
import { ActionButton, Panel, Title } from '@/components/admin/Ui';
import { Button } from '@/components/ui/Button';
import { inputClass, labelClass } from '@/components/ui/styles';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

async function FaqForm({ faq }) {
  const t = await getT();
  return (
    <form action={saveFaq} className="grid gap-3">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <label className={labelClass}>{t('Question')}<input name="question" required defaultValue={faq?.question} className={inputClass} /></label>
      <label className={labelClass}>{t('Answer')}<textarea name="answer" required rows={3} defaultValue={faq?.answer} className={inputClass} /></label>
      <label className={labelClass}>{t('Urdu answer (optional)')}<textarea name="answer_ur" rows={2} dir="rtl" defaultValue={faq?.answer_ur ?? ''} className={inputClass} /></label>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">{t('Order')} <input name="sort" type="number" defaultValue={faq?.sort ?? 0} className="w-16 rounded-md border border-[var(--d-line,#dce0dc)] px-2 py-1" /></label>
        <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="active" defaultChecked={faq ? faq.active : true} className="accent-navy" /> {t('Show on website')}</label>
        <Button type="submit" size="sm" className="cursor-pointer">{t(faq ? 'Save' : 'Add FAQ')}</Button>
      </div>
    </form>
  );
}

export default async function Faqs() {
  const t = await getT();
  await requireAdmin();
  const faqs = await getDb().faq.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] });
  return (
    <div className="max-w-[760px]">
      <Title>{t('FAQs')}</Title>
      {faqs.map((faq) => <Panel key={faq.id}><FaqForm faq={faq} /><div className="mt-2 text-right"><ActionButton action={deleteFaq} fields={{ id: faq.id }} tone="outline">{t('Delete')}</ActionButton></div></Panel>)}
      <Panel title={t('Add a question')}><FaqForm /></Panel>
    </div>
  );
}
