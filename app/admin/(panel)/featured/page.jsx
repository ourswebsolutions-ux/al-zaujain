import Link from 'next/link';
import { setFeatured } from '@/app/actions/admin';
import { FeaturedAdd } from '@/components/admin/FeaturedAdd';
import { ActionButton, Panel, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { profileCode } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Featured() {
  const t = await getT();
  await requireAdmin();
  const rows = await getDb().profile.findMany({ where: { featured: true }, select: { id: true, display_name: true, city: true, featured_sort: true }, orderBy: [{ featured_sort: 'asc' }, { id: 'asc' }] });
  return (
    <>
      <Title>{t('Homepage proposals')}</Title>
      <p className="mb-4 text-xs text-muted">{t('The homepage shows the first four, lowest order number first.')}</p>
      <Panel title={t('Add a proposal')}><FeaturedAdd /></Panel>
      <Table head={['Profile', 'City', 'Order', '']} empty={rows.length === 0 ? 'Nothing is featured yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Link href={`/admin/profiles/${profileCode(row.id)}`} className="font-semibold text-navy">{profileCode(row.id)} · {row.display_name}</Link></td>
            <td>{row.city}</td>
            <td>
              <form action={setFeatured} className="flex gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="featured" value="1" />
                <input name="sort" type="number" defaultValue={row.featured_sort} aria-label={t('Order')} className={`${inputSm} w-20`} />
                <Button type="submit" tone="outline" size="sm" className="cursor-pointer">{t('Save')}</Button>
              </form>
            </td>
            <td><ActionButton action={setFeatured} fields={{ id: row.id, featured: 0, sort: 100 }} tone="outline">{t('Remove')}</ActionButton></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
