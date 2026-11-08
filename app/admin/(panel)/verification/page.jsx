import { reviewVerification } from '@/app/actions/admin';
import { ActionButton, Badge, Identity, Table, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/lib/auth.js';
import { getDb } from '@/lib/db.js';
import { formatDate, profileCode } from '@/lib/format.js';
import { getLang, getT } from '@/lib/i18n/server.js';

export default async function Verification() {
  const t = await getT();
  const lang = await getLang();
  await requireAdmin();
  const documents = await getDb().cnicDocument.findMany({
    select: { created_at: true, back_file: true, profile: { select: { id: true, full_name: true, verification_status: true } } },
    orderBy: { created_at: 'desc' },
  });
  // Waiting documents come first.
  const rows = documents.map(({ profile, ...document }) => ({ ...document, ...profile })).sort((a, b) => (b.verification_status === 'pending') - (a.verification_status === 'pending'));
  return (
    <>
      <Title>{t('Blue tick requests')}</Title>
      <p className="mb-4 text-xs text-muted">{t('CNIC files are encrypted and only administrators can open them. Every view is written to the activity log.')}</p>
      <Table head={['Profile', 'Status', 'Submitted', 'Documents', 'Decision']} empty={rows.length === 0 ? 'No CNIC submissions yet.' : null}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td><Identity name={row.full_name} sub={profileCode(row.id)} href={`/admin/profiles/${profileCode(row.id)}`} /></td>
            <td><Badge value={row.verification_status} /></td>
            <td className="whitespace-nowrap">{formatDate(row.created_at, lang)}</td>
            <td className="whitespace-nowrap text-xs">
              <a href={`/api/admin/cnic/${row.id}/front`} target="_blank" rel="noopener" className="font-semibold text-navy underline">{t('Front')}</a>
              {row.back_file && <> · <a href={`/api/admin/cnic/${row.id}/back`} target="_blank" rel="noopener" className="font-semibold text-navy underline">{t('Back')}</a></>}
            </td>
            <td>
              <div className="flex flex-wrap gap-2">
                <ActionButton action={reviewVerification} fields={{ id: row.id, decision: 'verified' }}>{t('Verify')}</ActionButton>
                <form action={reviewVerification} className="flex gap-2">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <input name="note" aria-label={t('Reason')} placeholder={t('Reason')} className={`${inputSm} w-32`} />
                  <Button type="submit" tone="danger" size="sm" className="cursor-pointer">{t('Reject')}</Button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
