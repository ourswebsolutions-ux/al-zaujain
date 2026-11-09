import { FaEye, FaPen, FaPlus, FaTrash } from 'react-icons/fa6';
import { removeProfile, setPublished } from '@/app/actions/admin';
import { TypeBadge } from '@/components/profile/TypeBadge';
import { ActionButton, Badge, ConfirmDelete, FilterForm, Identity, IconLink, SearchField, Table, TablePager, Title } from '@/components/admin/Ui';
import { filterSelect, inputSm } from '@/components/admin/styles';
import { ButtonLink } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';
import { activeCountries } from '@/lib/places.js';
import { PROFILE_TYPES } from '@/lib/restrictions.js';

const SIZES = [10, 25, 50];

export default async function AdminProfiles({ searchParams }) {
  await requireAdmin();
  const [t, lang] = [await getT(), await getLang()];
  const { status = '', verification = '', q = '', type = '', country = '', city = '', page: rawPage, size: rawSize } = await searchParams;
  const size = SIZES.includes(Number(rawSize)) ? Number(rawSize) : 10;
  const where = {};
  if (['pending', 'approved', 'rejected', 'hidden'].includes(status)) where.status = status;
  if (PROFILE_TYPES.includes(type)) where.access_type = type;
  if (country) where.country_id = Number(country) || 0;
  if (city) where.city = { contains: city.slice(0, 80) };
  if (['not_submitted', 'pending', 'verified', 'rejected'].includes(verification)) where.verification_status = verification;
  if (q) {
    const code = /^\s*(az)?[\s-]*\d+\s*$/i.test(q) ? Number(q.replace(/\D/g, '')) : 0;
    where.OR = [{ full_name: { contains: q } }, { contact_email: { contains: q } }, { contact_phone: { contains: q } }, ...(code ? [{ id: code }] : [])];
  }
  const db = getDb();
  const countries = await activeCountries();
  const total = await db.profile.count({ where });
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, Number(rawPage) || 1), pages);
  const rows = await db.profile.findMany({
    where,
    select: {
      id: true, full_name: true, gender: true, city: true, status: true, verification_status: true, created_at: true, featured: true, access_type: true, source: true,
      country: { select: { name: true } }, user: { select: { id: true, name: true } },
      photos: { select: { thumb: true }, orderBy: [{ is_primary: 'desc' }, { sort: 'asc' }], take: 1 },
    },
    orderBy: [{ status: 'asc' }, { id: 'desc' }],
    take: size,
    skip: (page - 1) * size,
  });

  return (
    <>
      <Title text="Review, edit and remove matrimonial profiles." actions={<ButtonLink size="md" tone="gold" href="/admin/profiles/new"><FaPlus aria-hidden="true" /> {t('Add New Profile')}</ButtonLink>}>{t('Profiles')}</Title>
      <Table
        head={['Profile', 'Type', 'Location', 'Status', 'Verification', 'Submitted', 'Actions']}
        empty={rows.length === 0 ? 'No profiles found.' : null}
        toolbar={(
          <FilterForm clearHref="/admin/profiles" active={!!(q || status || verification || type || country || city)}>
            <select name="size" defaultValue={size} aria-label={t('Rows per page')} className={filterSelect}>{SIZES.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <SearchField value={q} placeholder="Name, email, phone or code" />
            <select name="status" defaultValue={status} aria-label={t('Status')} className={filterSelect}>
              <option value="">{t('All statuses')}</option><option value="pending">{t('Pending')}</option><option value="approved">{t('Approved')}</option><option value="rejected">{t('Rejected')}</option><option value="hidden">{t('Unpublished')}</option>
            </select>
            <select name="type" defaultValue={type} aria-label={t('Profile type')} className={filterSelect}>
              <option value="">{t('All types')}</option><option value="public">{t('Free')}</option><option value="paid">{t('Premium')}</option><option value="premium">{t('Exclusive')}</option>
            </select>
            <select name="country" defaultValue={country} aria-label={t('Country')} className={filterSelect}>
              <option value="">{t('All countries')}</option>
              {countries.map((item) => <option key={item.id} value={item.id}>{t(item.name)}</option>)}
            </select>
            <input name="city" defaultValue={city} placeholder={t('City')} aria-label={t('City')} className={`${inputSm} h-[42px] w-32`} />
            <select name="verification" defaultValue={verification} aria-label={t('Verification')} className={filterSelect}>
              <option value="">{t('Any verification')}</option><option value="verified">{t('Verified')}</option><option value="pending">{t('Pending')}</option><option value="not_submitted">{t('Not submitted')}</option><option value="rejected">{t('Rejected')}</option>
            </select>
          </FilterForm>
        )}
        footer={<TablePager page={page} pages={pages} total={total} perPage={size} path="/admin/profiles" query={{ status, verification, q, size, type, country, city }} />}
      >
        {rows.map((row) => {
          const code = profileCode(row.id);
          return (
            <tr key={row.id}>
              <td><Identity name={`${row.full_name}${row.featured ? ' ★' : ''}`} sub={`${code} · ${t(row.gender === 'female' ? 'Female' : 'Male')}`} src={row.photos[0] ? `/media/photos/${row.photos[0].thumb}` : null} href={`/admin/profiles/${code}`} /></td>
              <td><TypeBadge type={row.access_type} /></td>
              <td>{[t(row.city), t(row.country?.name)].filter(Boolean).join(', ')}</td>
              <td><Badge value={row.status} /></td>
              <td><Badge value={row.verification_status} /></td>
              <td className="whitespace-nowrap">{formatDate(row.created_at, lang)}</td>
              <td>
                <div className="flex items-center gap-0.5">
                  <IconLink href={`/admin/profiles/${code}`} label="View" icon={<FaEye aria-hidden="true" />} />
                  <IconLink href={`/admin/profiles/${code}/edit`} label="Edit" icon={<FaPen aria-hidden="true" />} />
                  {row.status === 'approved' && <ActionButton action={setPublished} fields={{ id: row.id, publish: 0 }} tone="outline">{t('Unpublish')}</ActionButton>}
                  {row.status === 'hidden' && <ActionButton action={setPublished} fields={{ id: row.id, publish: 1 }}>{t('Publish')}</ActionButton>}
                  <ConfirmDelete action={removeProfile} fields={{ id: row.id, next: '/admin/profiles' }} icon={<FaTrash aria-hidden="true" />} label="Delete profile" title={t('Delete profile {code}?', { code })} text="This permanently removes the profile, its photos and its CNIC. It cannot be undone." />
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
