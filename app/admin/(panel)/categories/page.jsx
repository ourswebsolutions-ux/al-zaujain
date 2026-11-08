import { deleteCategory, saveCategory } from '@/app/actions/admin';
import { ActionButton, Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

async function CategoryRow({ category }) {
  const t = await getT();
  return (
    <form action={saveCategory} className="grid grid-cols-[1fr_1fr_2fr_70px_auto_auto] items-center gap-2 border-t border-[var(--d-line,#eee6d8)] py-3 first:border-0 max-p:grid-cols-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input name="name" defaultValue={category?.name} required aria-label={t('Name')} placeholder={t('Category name')} className={inputSm} />
      <input name="name_ur" defaultValue={category?.name_ur ?? ''} aria-label={t('Urdu name')} placeholder={t('Urdu name')} dir="rtl" className={inputSm} />
      <input name="description" defaultValue={category?.description ?? ''} aria-label={t('Description')} placeholder={t('Description')} className={inputSm} />
      <input name="sort" type="number" defaultValue={category?.sort ?? 0} aria-label={t('Order')} className={inputSm} />
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={category ? category.active : true} className="accent-navy" /> {t('Active')}</label>
      <Button type="submit" size="sm" className="cursor-pointer">{t(category ? 'Save' : 'Add')}</Button>
    </form>
  );
}

export default async function Categories() {
  const t = await getT();
  await requireAdmin();
  const categories = await getDb().category.findMany({ orderBy: [{ sort: 'asc' }, { name: 'asc' }] });
  return (
    <>
      <Title>{t('Proposal categories')}</Title>
      <p className="mb-4 text-xs text-muted">{t('Each active category gets its own listing page and appears in the Proposals menu. Countries are placed in categories under Countries and cities.')}</p>
      <Panel>{categories.map((category) => <div key={category.id}><CategoryRow category={category} /><div className="pb-2 text-right"><ActionButton action={deleteCategory} fields={{ id: category.id }} tone="outline">Delete {category.name}</ActionButton></div></div>)}</Panel>
      <Panel title={t('Add a category')}><CategoryRow /></Panel>
    </>
  );
}
