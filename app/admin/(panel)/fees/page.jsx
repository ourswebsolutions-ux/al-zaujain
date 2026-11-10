import Link from 'next/link';
import { saveFeesAction } from '@/app/actions/credits';
import { Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { ActionForm, Submit } from '@/components/ui/Form';
import { requireAdmin } from '@/lib/auth.js';
import { getFees } from '@/lib/fees.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Consultancy fees' };

const label = 'grid min-w-0 gap-1 text-[12.5px] font-medium text-[var(--d-text,#47566a)] [&>input]:w-full [&>textarea]:w-full';

async function Rows({ prefix, rows }) {
  const t = await getT();
  // Two empty rows are always offered for a new category; empty rows are ignored when saving.
  const list = [...rows, { category: '', fee: '' }, { category: '', fee: '' }].slice(0, 12);
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[1fr_160px] gap-2 text-[11.5px] font-semibold uppercase tracking-[.6px] text-muted max-m:hidden"><span>{t('Proposal category')}</span><span>{t('Fee')}</span></div>
      {list.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_160px] gap-2 max-m:grid-cols-1">
          <input name={`${prefix}_category_${index}`} defaultValue={row.category} maxLength={200} aria-label={t('Proposal category')} placeholder={t('New category (optional)')} className={`${inputSm} w-full min-w-0`} />
          <input name={`${prefix}_fee_${index}`} defaultValue={row.fee} maxLength={40} aria-label={t('Fee')} placeholder="Rs. 0" className={`${inputSm} w-full min-w-0`} />
        </div>
      ))}
    </div>
  );
}

export default async function FeesAdmin() {
  await requireAdmin();
  const t = await getT();
  const fees = await getFees();
  return (
    <>
      <Title text="The official marriage consultancy fees, used in the Personalized Matchmaking section of the Packages page. These are not the website packages." actions={<Link href="/packages#personalizedMatching" target="_blank" className="text-[13px] font-medium text-navy">{t('View the Packages page')} ↗</Link>}>{t('Consultancy fees')}</Title>
      <ActionForm action={saveFeesAction} className="grid gap-0">
        <Panel title="Letterhead">
          <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
            <label className={label}>{t('Name')}<input name="company" defaultValue={fees.company} maxLength={120} className={inputSm} /></label>
            <label className={label}>{t('Registration line')}<input name="registered" defaultValue={fees.registered} maxLength={120} className={inputSm} /></label>
            <label className={label}>{t('City')}<input name="city" defaultValue={fees.city} maxLength={120} className={inputSm} /></label>
            <label className={label}>{t('NTN line')}<input name="ntn" defaultValue={fees.ntn} maxLength={120} className={inputSm} /></label>
            <label className={label}>{t('CEO line')}<input name="ceo" defaultValue={fees.ceo} maxLength={120} className={inputSm} /></label>
          </div>
        </Panel>
        <Panel title="Advance registration fees (non-refundable)"><Rows prefix="registration" rows={fees.registration} /></Panel>
        <Panel title="Rishta finalization fees (after the rishta is done)"><Rows prefix="finalization" rows={fees.finalization} /></Panel>
        <Panel title="International services and contact">
          <div className="grid gap-3">
            <label className={label}>{t('Countries served')}<textarea name="countries" rows={2} maxLength={600} defaultValue={fees.countries} className={inputSm} /></label>
            <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
              <label className={label}>{t('WhatsApp')}<input name="whatsapp" defaultValue={fees.whatsapp} maxLength={30} dir="ltr" className={inputSm} /></label>
              <label className={label}>{t('Email')}<input name="email" type="email" defaultValue={fees.email} maxLength={160} dir="ltr" className={inputSm} /></label>
            </div>
          </div>
        </Panel>
        <Submit className="w-fit cursor-pointer">{t('Save fee structure')}</Submit>
      </ActionForm>
    </>
  );
}
