import { FaTrash } from 'react-icons/fa6';
import { deleteCaste, saveCaste } from '@/app/actions/admin';
import { ActionButton, ConfirmDelete, Panel, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Castes / Biradari' };

const check = 'flex cursor-pointer items-center gap-1.5 text-xs';

export default async function Castes() {
  const t = await getT();
  await requireAdmin();
  const db = getDb();
  const castes = await db.caste.findMany({ orderBy: [{ popular: 'desc' }, { sort: 'asc' }, { name: 'asc' }] });
  const usage = await db.profile.groupBy({ by: ['caste'], where: { caste: { not: null } }, _count: { caste: true }, orderBy: { _count: { caste: 'desc' } } });
  const counts = new Map(usage.map((row) => [row.caste.toLowerCase(), row._count.caste]));
  const listed = new Set(castes.map((caste) => caste.name.toLowerCase()));
  const unlisted = usage.filter((row) => !listed.has(row.caste.toLowerCase())).slice(0, 40);

  return (
    <>
      <Title text="These castes appear in the searchable lists on the website, the search filters and the profile form. Families can still type a caste that is not listed.">{t('Castes / Biradari')}</Title>

      <Panel title="Add castes">
        <form action={saveCaste} className="flex flex-wrap items-center gap-2">
          <input name="name" required maxLength={400} placeholder={t('Caste name, or several separated by commas')} aria-label={t('Caste name')} className={`${inputSm} min-w-[300px] flex-1 max-m:min-w-0 max-m:basis-full`} />
          <input name="name_ur" maxLength={60} placeholder={t('Urdu name')} aria-label={t('Urdu name')} dir="rtl" className={`${inputSm} w-40 font-urdu max-m:flex-1`} />
          <label className={check}><input type="checkbox" name="popular" className="accent-navy" /> {t('Popular')}</label>
          <Button type="submit" size="sm" className="cursor-pointer">{t('Add')}</Button>
        </form>
        <p className="mt-2 text-xs text-muted">{t('Popular castes are listed first.')}</p>
      </Panel>

      {unlisted.length > 0 && (
        <Panel title="Typed on profiles but not in the list">
          <ul className="flex flex-wrap gap-2">
            {unlisted.map((row) => (
              <li key={row.caste} className="flex items-center gap-2 rounded-full border border-line py-0.5 ps-3 pe-1 text-xs">
                <span className="max-w-[220px] truncate">{row.caste}</span>
                <span className="text-muted">({row._count.caste})</span>
                <ActionButton action={saveCaste} fields={{ name: row.caste }} tone="outline">{t('Add to list')}</ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Table head={['Caste', 'Urdu name', 'Profiles', 'Order', 'Options', '']} empty={castes.length === 0 ? 'No castes yet. Add the first one above.' : null}>
        {castes.map((caste) => {
          const formId = `caste-${caste.id}`;
          return (
            <tr key={caste.id}>
              <td>
                <form id={formId} action={saveCaste}><input type="hidden" name="id" value={caste.id} /></form>
                <input form={formId} name="name" defaultValue={caste.name} required maxLength={60} aria-label={t('Caste name')} className={`${inputSm} w-44 font-semibold`} />
              </td>
              <td><input form={formId} name="name_ur" defaultValue={caste.name_ur ?? ''} maxLength={60} dir="rtl" aria-label={t('Urdu name')} className={`${inputSm} w-32 font-urdu`} /></td>
              <td>{counts.get(caste.name.toLowerCase()) ?? 0}</td>
              <td><input form={formId} name="sort" type="number" min="0" max="999" defaultValue={caste.sort} aria-label={t('Order')} className={`${inputSm} w-20`} /></td>
              <td>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  <label className={check}><input form={formId} type="checkbox" name="popular" defaultChecked={caste.popular} className="accent-navy" /> {t('Popular')}</label>
                  <label className={check}><input form={formId} type="checkbox" name="active" defaultChecked={caste.active} className="accent-navy" /> {t('Shown')}</label>
                  <label className={check} title={t('When you rename a caste, profiles saved with the old name are changed too.')}><input form={formId} type="checkbox" name="rename_profiles" defaultChecked className="accent-navy" /> {t('Rename on profiles too')}</label>
                </div>
              </td>
              <td>
                <div className="flex items-center justify-end gap-1">
                  <Button form={formId} type="submit" size="sm" tone="outline" className="cursor-pointer">{t('Save')}</Button>
                  <ConfirmDelete action={deleteCaste} fields={{ id: caste.id }} icon={<FaTrash aria-hidden="true" />} label={`Delete ${caste.name}`} title="Delete this caste?" text="It is removed from the lists. Profiles that use it keep it." />
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
