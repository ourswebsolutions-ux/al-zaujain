'use client';

import { useT } from '@/components/i18n/LanguageProvider';
import { BidiText, Urdu } from '@/components/ui/Text';

const plain = (value) => /@|:\/\//.test(String(value));

// The profile page's rows: each heading above its value, three to a line, with a dashed rule.
function Rows({ rows, columns = 3 }) {
  const t = useT();
  return (
    <dl className={`grid gap-x-7 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col items-start gap-1 border-b border-dashed border-[#e9e2d4] py-2.5">
          <dt className="text-[11.5px] font-semibold capitalize text-[#8a6a2c]">{t(row.label)}</dt>
          <dd className={`w-full break-words text-start text-[13.5px] font-semibold leading-snug text-navy ${plain(row.value) ? 'normal-case' : 'capitalize'}`}>{t(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

const Subheading = ({ children }) => <h3 className="mb-1 mt-5 text-[10.5px] font-bold uppercase tracking-[1.6px] text-bronze">{children}</h3>;

function SectionHeading({ letter, title, ur }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-[#eee6d8] pb-2.5">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-gold font-nunito text-[12px] font-extrabold text-[#9b712b]">{letter}</span>
      <h2 className="font-quicksand text-[17px] font-bold capitalize text-navy">{title}</h2>
      {ur && <Urdu keep as="span" className="ml-auto whitespace-nowrap text-[14px] leading-8 text-[#9b712b]">{ur}</Urdu>}
    </div>
  );
}

// The branded biodata captured for the image and PDF downloads, in the profile page's design: the navy
// Profile ID band, the photo with the name, the highlight tiles, section A (candidate) and section B
// (partner requirements). Fixed A4 width, so it looks the same whichever screen it is created on.
// Every [data-block] is kept whole on one PDF page.
export function ExportSheet({ data, subtitle, photo, phone, generatedOn }) {
  const t = useT();
  const highlights = (data.highlights ?? []).filter((item) => item.value);
  return (
    <div className="w-[794px] bg-white font-sans text-ink">
      <div data-block className="border-b-[3px] border-gold bg-navy px-10 py-6 text-white">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="size-[58px] rounded-full bg-white" />
          <div className="flex-1">
            <p className="text-[20px] font-bold tracking-[1px]">AL ZAUJAIN</p>
            <p className="text-[10px] font-medium uppercase tracking-[1.6px] text-champagne">{t('Marriage Bureau Multan Pakistan')}</p>
          </div>
          <div className="text-end">
            <p className="text-[9px] tracking-[2px] text-champagne">{t('PROFILE ID')}</p>
            <p className="font-nunito text-[22px] font-extrabold">{data.code}</p>
          </div>
        </div>
        {data.headline && <p lang="ur" dir="rtl" className="mt-2 text-center font-urdu text-[24px] leading-[2.2] text-champagne">{data.headline}</p>}
      </div>

      <div data-block className="flex items-center gap-7 bg-[#fcfbf8] px-10 py-6">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-[190px] shrink-0 rounded-[18px] object-cover shadow-[0_10px_24px_#062b4e1f]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/logo.png" alt="" className="size-[190px] shrink-0 rounded-[18px] bg-[#e9e1d1] p-10 opacity-70" />
        )}
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-poppins)] text-[30px] font-bold capitalize leading-tight text-navy">
            {data.name}
            {data.verified && <span className="ms-2 inline-block rounded-full bg-[#e8f4ff] px-2.5 py-0.5 align-middle text-[12px] font-semibold text-verified">✓ {t('Verified')}</span>}
          </p>
          {subtitle && <p className="mt-1 text-[13.5px] capitalize text-muted">{subtitle}</p>}
          <Urdu keep className="mt-1 text-start text-base leading-10 text-[#9b712b]">رشتے محبت کے، فیصلے اپنوں کے</Urdu>
        </div>
      </div>

      <div className="px-10 pt-6">
        <div data-block className="pb-2">
          <SectionHeading letter="A" title={t('Candidate information')} ur="امیدوار کی معلومات" />
          {highlights.length > 0 && (
            <ul className="mb-3 grid grid-cols-4 gap-3">
              {highlights.map((item) => (
                <li key={item.label} className="rounded-xl border border-[#ece4d4] bg-[#fbf8f1] px-3.5 py-2.5">
                  <p className="text-[10.5px] capitalize text-muted">{t(item.label)}</p>
                  <p className="font-nunito text-[16px] font-extrabold capitalize leading-tight text-navy">{t(item.value)}</p>
                </li>
              ))}
            </ul>
          )}
          <Rows rows={data.candidate} />
        </div>
        {data.residence.length > 0 && <div data-block className="pb-2"><Subheading>{t('Residence')}</Subheading><Rows rows={data.residence} /></div>}
        {data.family.length > 0 && <div data-block className="pb-2"><Subheading>{t('Family details')}</Subheading><Rows rows={data.family} /></div>}
        {data.familyBackground && <div data-block className="pb-2"><Subheading>{t('Family background')}</Subheading><BidiText text={data.familyBackground} className="text-[#536471]" englishClass="text-[12.5px] leading-[1.7]" urduClass="text-[14px] leading-[2.4]" /></div>}
        {data.about && <div data-block className="pb-2"><Subheading>{t('About the candidate')}</Subheading><BidiText text={data.about} className="text-[#536471]" englishClass="text-[12.5px] leading-[1.7]" urduClass="text-[14px] leading-[2.4]" /></div>}
        {data.contact.length > 0 && (
          <div data-block className="mb-4 mt-5 rounded-xl bg-[#f8f4eb] px-5 py-4">
            <h3 className="mb-1 text-[13px] font-semibold capitalize text-navy">🔒 {t('Private contact details')}</h3>
            <Rows rows={data.contact} />
          </div>
        )}
        <div className="pb-4" />
      </div>

      {(data.partner.demand || data.partner.rows.length > 0) && (
        <div data-block className="border-t-[3px] border-gold bg-[#fbf8f1] px-10 py-6">
          <div className="mb-3 text-center">
            <span aria-hidden="true" className="mx-auto mb-1 grid size-7 place-items-center rounded-full border border-gold font-nunito text-[12px] font-extrabold text-[#9b712b]">B</span>
            <Urdu keep as="h2" className="text-center text-[21px] leading-[2.1] text-navy">رشتے کی ضروریات</Urdu>
            <p className="text-[10px] font-bold uppercase tracking-[2.4px] text-bronze">{t('Partner requirements')}</p>
          </div>
          {data.partner.demand && <BidiText text={data.partner.demand} className="mb-3 rounded-2xl border border-[#ece4d4] bg-white px-6 py-4 text-navy" englishClass="text-[13px] leading-[1.75]" urduClass="text-[15px] leading-[2.5]" />}
          {data.partner.rows.length > 0 && <Rows rows={data.partner.rows} columns={2} />}
        </div>
      )}

      <div data-block className="flex items-center justify-between bg-navy px-10 py-4 text-[11px] text-white">
        <span>{t('Trusted matchmaking for a better future.')}</span>
        <span dir="ltr" className="text-champagne">{phone}</span>
        <span>{generatedOn}</span>
      </div>
    </div>
  );
}
