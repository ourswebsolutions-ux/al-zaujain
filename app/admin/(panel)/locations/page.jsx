import { saveCity, saveCountry, updateCity } from '@/app/actions/admin';
import { ActionButton, Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { getT } from '@/lib/i18n/server.js';

export default async function Locations() {
  const t = await getT();
  await requireAdmin();
  const db = getDb();
  const categories = await db.category.findMany({ select: { id: true, name: true }, orderBy: { sort: 'asc' } });
  const countries = await db.country.findMany({ orderBy: { name: 'asc' } });
  const cities = await db.city.findMany({ orderBy: [{ featured: 'desc' }, { name: 'asc' }] });

  const CategorySelect = ({ value }) => (
    <select name="category_id" defaultValue={value ?? ''} aria-label={t('Category')} className={inputSm}>
      <option value="">{t('No category')}</option>
      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
    </select>
  );

  return (
    <>
      <Title text="Countries and cities shown in the searchable lists on the website and in the profile form. Hidden ones are left out of the lists; profiles keep them.">{t('Countries and cities')}</Title>
      <Panel title={t('Add a country')}>
        <form action={saveCountry} className="flex flex-wrap gap-2">
          <input name="name" required placeholder={t('Country name')} aria-label={t('Country name')} className={inputSm} />
          <CategorySelect />
          <Button type="submit" size="sm" className="cursor-pointer">{t('Add country')}</Button>
        </form>
      </Panel>
      <Panel title={t('Add a city')}>
        <form action={saveCity} className="flex flex-wrap items-center gap-2">
          <input name="name" required placeholder={t('City name')} aria-label={t('City name')} className={inputSm} />
          <select name="country_id" required aria-label={t('Country')} className={inputSm}>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="featured" className="accent-navy" /> {t('Show in homepage search')}</label>
          <Button type="submit" size="sm" className="cursor-pointer">{t('Add city')}</Button>
        </form>
      </Panel>
      {countries.map((country) => (
        <Panel key={country.id}>
          <form action={saveCountry} className="mb-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={country.id} />
            <input name="name" defaultValue={country.name} aria-label={t('Country name')} className={`${inputSm} font-semibold`} />
            <CategorySelect value={country.category_id} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={country.active} className="accent-navy" /> {t('Active')}</label>
            <Button type="submit" size="sm" tone="outline" className="cursor-pointer">{t('Save')}</Button>
          </form>
          <ul className="flex flex-wrap gap-2">
            {cities.filter((city) => city.country_id === country.id).map((city) => (
              <li key={city.id} className={`flex items-center gap-1 rounded-full border border-line py-0.5 pl-3 pr-1 text-xs ${city.active ? '' : 'opacity-60'}`}>
                {t(city.featured ? '★ ' : '')}{city.name}{!city.active && <span className="text-muted"> ({t('hidden')})</span>}
                <ActionButton action={updateCity} fields={{ id: city.id, action: 'feature' }} tone="outline">{t(city.featured ? 'Unstar' : 'Star')}</ActionButton>
                <ActionButton action={updateCity} fields={{ id: city.id, action: 'active' }} tone="outline">{t(city.active ? 'Hide' : 'Show')}</ActionButton>
                <ActionButton action={updateCity} fields={{ id: city.id, action: 'delete' }} tone="outline">{t('Remove')}</ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </>
  );
}
