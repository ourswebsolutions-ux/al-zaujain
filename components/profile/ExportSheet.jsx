'use client';

import { useT } from '@/components/i18n/LanguageProvider';
import { BidiText, Urdu } from '@/components/ui/Text';

function Rows({ rows }) {
  const t = useT();
  return (
    <dl className="grid grid-cols-2 gap-x-8">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#e9e2d4] py-1.5">
          <dt className="shrink-0 text-[11px] text-muted">{t(row.label)}</dt>
          <dd className="break-words text-end text-[12.5px] font-semibold text-navy">{t(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

const Heading = ({ children }) => <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[1.6px] text-bronze">{children}</h3>;

// The branded biodata captured for the image and PDF downloads. Fixed width, so it looks
// the same whichever screen it is created on.
export function ExportSheet({ data, subtitle, photo, phone, generatedOn }) {
  const t = useT();
  return (
    <div className="w-[794px] bg-white font-sans text-ink">
      <div data-block className="border-b-[3px] border-gold bg-navy px-12 py-7 text-white">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="size-[66px] rounded-full bg-white" />
          <div className="flex-1">
            <p className="text-[22px] font-bold tracking-[1px]">AL ZAUJAIN</p>
            <p className="text-[10px] font-medium tracking-[1.6px] text-champagne">{t('INTERNATIONAL MARRIAGE CONSULTANCY')}</p>
          </div>
          <div className="text-end">
            <p className="text-[9px] tracking-[2px] text-champagne">{t('PROFILE ID')}</p>
            <p className="text-xl font-bold">{data.code}</p>
          </div>
        </div>
        {data.headline && <p lang="ur" dir="rtl" className="mt-2 text-center font-urdu text-[24px] leading-[2.2] text-champagne">{data.headline}</p>}
      </div>

      <div data-block className="flex items-center gap-7 bg-cream px-12 py-6">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-[150px] rounded-[20px] border-4 border-white object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/logo.png" alt="" className="size-[150px] rounded-[20px] border-4 border-white bg-[#e9e1d1] p-6" />
        )}
        <div>
          <p className="font-nunito text-[32px] font-extrabold leading-tight text-navy">{data.name}{data.verified && <span className="ms-2 align-middle text-sm font-semibold text-verified">✓ {t('Verified')}</span>}</p>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
          <Urdu keep className="text-start text-base leading-10 text-[#9b712b]">رشتے محبت کے، فیصلے اپنوں کے</Urdu>
        </div>
      </div>

      <div className="px-12 pt-6">
        <div data-block className="pb-4">
          <h2 className="mb-2 border-b-2 border-gold pb-1.5 font-quicksand text-base font-bold text-navy">{t('Candidate information')}</h2>
          <Rows rows={data.candidate} />
        </div>
        {data.residence.length > 0 && <div data-block className="pb-4"><Heading>{t('Residence')}</Heading><Rows rows={data.residence} /></div>}
        {data.family.length > 0 && <div data-block className="pb-4"><Heading>{t('Family details')}</Heading><Rows rows={data.family} /></div>}
        {data.familyBackground && <div data-block className="pb-4"><Heading>{t('Family background')}</Heading><BidiText text={data.familyBackground} className="text-muted" englishClass="text-[12.5px] leading-[1.7]" urduClass="text-[14px] leading-[2.4]" /></div>}
        {data.about && <div data-block className="pb-4"><Heading>{t('About the candidate')}</Heading><BidiText text={data.about} className="text-muted" englishClass="text-[12.5px] leading-[1.7]" urduClass="text-[14px] leading-[2.4]" /></div>}
        {data.contact.length > 0 && <div data-block className="pb-4"><Heading>{t('Private contact details')}</Heading><Rows rows={data.contact} /></div>}
      </div>

      {(data.partner.demand || data.partner.rows.length > 0) && (
        <div data-block className="border-t-[3px] border-gold bg-[#fbf8f1] px-12 py-6">
          <div className="mb-3 text-center">
            <Urdu keep as="h2" className="text-center text-[21px] leading-[2.1] text-navy">رشتے کی ضروریات</Urdu>
            <p className="text-[10px] font-bold uppercase tracking-[2.4px] text-bronze ur:hidden">Partner requirements</p>
          </div>
          <BidiText text={data.partner.demand} className="mb-3 text-navy" englishClass="text-[13px] leading-[1.75]" urduClass="text-[15px] leading-[2.5]" />
          <Rows rows={data.partner.rows} />
        </div>
      )}

      <div data-block className="flex items-center justify-between bg-navy px-12 py-4 text-[11px] text-white">
        <span>{t('Trusted matchmaking for a better future.')}</span>
        <span dir="ltr" className="text-champagne">{phone}</span>
        <span>{generatedOn}</span>
      </div>
    </div>
  );
}
