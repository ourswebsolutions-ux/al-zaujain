import Link from 'next/link';
import { FaStar, FaTrash } from 'react-icons/fa6';
import { deletePackage, savePackage, saveUnlockCost, togglePackage } from '@/app/actions/credits';
import { ActionButton, Badge, ConfirmDelete, Identity, Panel, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { ActionForm, Submit } from '@/components/ui/Form';
import { PAYMENT_STATUS } from '@/lib/access-text.js';
import { requireAdmin } from '@/lib/auth.js';
import { unlockCost } from '@/lib/credits.js';
import { getDb } from '@/lib/db.js';
import { formatDateTime } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Premium Profile Packages' };

const label = 'grid min-w-0 gap-1 text-[12.5px] font-medium text-[var(--d-text,#47566a)] [&>input]:w-full [&>input]:min-w-0 [&>textarea]:w-full';
const check = 'flex cursor-pointer items-center gap-1.5 text-[13px]';

async function PackageFields({ pack }) {
  const t = await getT();
  return (
    <>
      {pack && <input type="hidden" name="id" value={pack.id} />}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 max-p:grid-cols-2 max-m:grid-cols-1">
        <label className={label}>{t('Package name')}<input name="name" required maxLength={100} defaultValue={pack?.name ?? ''} placeholder={t('e.g. Bronze')} className={inputSm} /></label>
        <label className={label}>{t('Type')}
          <select name="kind" defaultValue={pack?.kind ?? 'credits'} className={inputSm}>
            <option value="credits">{t('Profile connects')}</option>
            <option value="boost">{t('Boost my proposal')}</option>
          </select>
        </label>
        <label className={label}>{t('Profiles (connects)')}
          <select name="scope" defaultValue={pack?.scope ?? 'local'} className={inputSm}>
            <option value="local">{t('Local (Pakistan)')}</option>
            <option value="foreign">{t('International (Foreign + Pakistan)')}</option>
          </select>
        </label>
        <label className={label}>{t('Order')}<input name="sort" type="number" min="0" max="999" defaultValue={pack?.sort ?? 100} className={inputSm} /></label>
      </div>
      <div className="grid grid-cols-4 gap-3 max-p:grid-cols-2 max-m:grid-cols-1">
        <label className={label}>{t('Profile connects (credits)')}<input name="credits" type="number" min="0" max="10000" defaultValue={pack?.credits ?? ''} placeholder="30" className={inputSm} /></label>
        <label className={label}>{t('Boost days')}<input name="days" type="number" min="1" max="365" defaultValue={pack?.days ?? ''} placeholder="15" className={inputSm} /></label>
        <label className={label}>{t('Price (PKR)')}<input name="price" inputMode="decimal" required defaultValue={pack ? Number(pack.price) : ''} placeholder="1500" className={inputSm} /></label>
        <label className={label}>{t('Price before discount (optional)')}<input name="was_price" inputMode="decimal" defaultValue={pack?.was_price != null ? Number(pack.was_price) : ''} placeholder="3000" className={inputSm} /></label>
      </div>
      <p className="text-[12px] leading-5 text-muted">{t('Profile connect packages fill "Profile connects"; Boost packages fill "Boost days". Local packages open Pakistan profiles; an International package also opens overseas profiles. The price before discount shows as "50% OFF".')}</p>
      <label className={label}>{t('Description')}<textarea name="description" rows={2} maxLength={500} defaultValue={pack?.description ?? ''} placeholder={t('Shown to members under the package')} className={inputSm} /></label>
      <div className="flex flex-wrap items-center gap-5">
        <label className={check}><input type="checkbox" name="active" defaultChecked={pack ? pack.active : true} className="accent-navy" /> {t('Active (members can buy it)')}</label>
        <label className={check}><input type="checkbox" name="featured" defaultChecked={pack?.featured ?? false} className="accent-navy" /> {t('Featured (shown first, highlighted)')}</label>
        <label className={check}><input type="checkbox" name="super_boost" defaultChecked={pack?.super_boost ?? false} className="accent-navy" /> {t('Super Boost (above Boost)')}</label>
        <label className={check}><input type="checkbox" name="audio_call" defaultChecked={pack?.audio_call ?? false} className="accent-navy" /> {t('Audio call available')}</label>
        <label className={check}><input type="checkbox" name="video_call" defaultChecked={pack?.video_call ?? false} className="accent-navy" /> {t('Video call available')}</label>
        <label className={check}>{t('Card colour')} <input type="color" name="color" defaultValue={pack?.color ?? '#b08d57'} className="h-7 w-10 cursor-pointer rounded border border-[var(--d-line,#e7e9ee)]" /></label>
      </div>
    </>
  );
}

export default async function Packages() {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const db = getDb();
  const packages = await db.creditPackage.findMany({ orderBy: [{ featured: 'desc' }, { sort: 'asc' }, { credits: 'asc' }], include: { _count: { select: { payments: true } } } });
  const sold = await db.paymentRequest.groupBy({ by: ['package_id'], where: { package_id: { not: null }, status: 'approved' }, _count: { id: true }, _sum: { credits: true, amount: true } });
  const soldBy = new Map(sold.map((row) => [row.package_id, row]));
  const purchases = await db.paymentRequest.findMany({ where: { OR: [{ package_id: { not: null } }, { credits: { not: null } }] }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { id: 'desc' }, take: 50 });
  const cost = await unlockCost();
  return (
    <>
      <Title text="Members buy these packages: profile connects (Local or International) to unlock Premium profiles, and Boosts to put their proposal at the top of search. Separate from the official consultancy fees.">{t('Rishta Packages')}</Title>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6 max-p:grid-cols-1 [&>*]:min-w-0">
        <Panel title="Create a package">
          <ActionForm action={savePackage}>
            <PackageFields />
            <Submit className="w-fit cursor-pointer">{t('Create package')}</Submit>
          </ActionForm>
        </Panel>
        <Panel title="Credits per unlock">
          <ActionForm action={saveUnlockCost} className="grid gap-3">
            <p className="text-[13px] leading-5 text-muted">{t('How many credits a member spends to unlock one Premium profile. Free profiles never use credits.')}</p>
            <div className="flex items-center gap-2">
              <input name="cost" type="number" min="1" max="100" defaultValue={cost} aria-label={t('Credits per unlock')} className={`${inputSm} w-24`} />
              <Submit size="sm" className="cursor-pointer">{t('Save')}</Submit>
            </div>
          </ActionForm>
        </Panel>
      </div>

      {packages.length === 0 ? (
        <Panel><p className="py-6 text-center text-sm text-muted">{t('No packages yet. Create the first one above, for example Starter: 5 profiles for Rs 1,000.')}</p></Panel>
      ) : (
        <div className="grid grid-cols-2 gap-6 max-p:grid-cols-1 [&>*]:min-w-0">
          {packages.map((pack) => {
            const stats = soldBy.get(pack.id);
            return (
              <Panel key={pack.id} title={`${pack.name} · ${pack.kind === 'boost' ? t('Boost · {days} days', { days: pack.days }) : `${t('{count} credits', { count: pack.credits })} · ${t(pack.scope === 'foreign' ? 'International' : 'Local')}`} · Rs ${Number(pack.price).toLocaleString('en-PK')}`}>
                <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2">
                  <Badge value={pack.active ? 'active' : 'inactive'} label={pack.active ? 'Active' : 'Hidden'} />
                  {pack.featured && <span className="inline-flex items-center gap-1 rounded-md bg-[#fcf4e1] px-2.5 py-1 text-xs font-medium text-[#806126]"><FaStar aria-hidden="true" /> {t('Featured')}</span>}
                  <span className="text-xs text-muted">{t('{count} approved purchases', { count: stats?._count.id ?? 0 })} · {t('{count} credits sold', { count: stats?._sum.credits ?? 0 })}</span>
                </div>
                <ActionForm action={savePackage} className="grid gap-3">
                  <PackageFields pack={pack} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Submit size="sm" className="cursor-pointer">{t('Save changes')}</Submit>
                  </div>
                </ActionForm>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--d-line,#eef0f3)] pt-3">
                  <ActionButton action={togglePackage} fields={{ id: pack.id, field: 'active' }} tone="outline">{t(pack.active ? 'Hide from members' : 'Show to members')}</ActionButton>
                  <ActionButton action={togglePackage} fields={{ id: pack.id, field: 'featured' }} tone="outline">{t(pack.featured ? 'Remove featured' : 'Mark featured')}</ActionButton>
                  <ConfirmDelete action={deletePackage} fields={{ id: pack.id }} icon={<FaTrash aria-hidden="true" />} label={`Delete ${pack.name}`} title="Delete this package?" text={pack._count.payments ? 'It has purchases, so it is hidden instead and kept for your records.' : 'It has never been bought, so it is removed completely.'} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-2 text-[15px] font-semibold text-navy">{t('Package purchases')}</h2>
      <Table head={['Member', 'Package', 'Credits', 'Amount', 'Status', 'Date', '']} empty={purchases.length === 0 ? 'No package purchases yet.' : null}>
        {purchases.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.user.name} sub={row.user.email} href={`/admin/credits?user=${row.user.id}`} /></td>
            <td>{row.package_name}</td>
            <td>{row.credits}</td>
            <td className="whitespace-nowrap">Rs {Number(row.amount).toLocaleString('en-PK')}</td>
            <td><Badge value={row.status} label={PAYMENT_STATUS[row.status]} /></td>
            <td className="whitespace-nowrap">{formatDateTime(row.created_at, lang)}</td>
            <td><Link href={`/admin/payment-requests/${row.id}`} className="text-[13px] font-medium text-navy">{t('Review')}</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
