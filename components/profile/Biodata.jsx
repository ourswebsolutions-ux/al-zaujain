import Image from 'next/image';
import { FaLock } from 'react-icons/fa6';
import { BidiText, Urdu } from '@/components/ui/Text';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getT } from '@/lib/i18n/server.js';

function SectionHeading({ letter, title, ur }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-[#eee6d8] pb-3">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-gold font-nunito text-[13px] font-extrabold text-[#9b712b]">{letter}</span>
      <h2 className="min-w-0 font-quicksand text-[19px] font-bold text-navy max-m:text-[16px]">{title}</h2>
      {ur && <Urdu as="span" className="ms-auto shrink-0 whitespace-nowrap text-base leading-9 text-[#9b712b] max-m:text-xs">{ur}</Urdu>}
    </div>
  );
}

function Subheading({ children }) {
  return <h3 className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-[1.6px] text-bronze">{children}</h3>;
}

async function InfoGrid({ rows, columns = 'grid-cols-3 max-p:grid-cols-2 max-m:grid-cols-1' }) {
  const t = await getT();
  return (
    <dl className={`grid gap-x-7 ${columns}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#e9e2d4] py-2.5 max-sm:flex-col max-sm:items-start max-sm:gap-1 max-sm:py-3">
          <dt className="shrink-0 text-xs capitalize text-muted max-sm:text-[12.5px] max-sm:font-semibold max-sm:text-[#8a6a2c]">{t(row.label)}</dt>
          <dd className={`min-w-0 break-words text-end text-sm font-semibold text-navy ${/@|:\/\//.test(String(row.value)) ? '' : 'capitalize'} max-sm:w-full max-sm:text-start max-sm:text-[15px]`}>{t(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function BiodataHeader({ data }) {
  const t = await getT();
  return (
    <header className="relative border-b-[3px] border-gold bg-navy px-9 py-6 text-white max-m:px-5">
      <div className="flex items-center gap-4">
        <Image src="/images/logo.png" alt="" width={56} height={56} className="size-14 rounded-full bg-white max-m:size-11" />
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-[1px] max-m:text-[15px]">{t('AL ZAUJAIN')}</p>
          <p className="text-[10px] font-medium tracking-[1.4px] text-champagne max-m:text-[7px] max-m:tracking-[.3px]">{t('INTERNATIONAL MARRIAGE CONSULTANCY')}</p>
        </div>
        <div className="ms-auto shrink-0 text-end">
          <p className="text-[9px] tracking-[2px] text-champagne">{t('PROFILE ID')}</p>
          <p className="font-nunito text-xl font-extrabold">{data.code}</p>
        </div>
      </div>
      {data.headline && <p lang="ur" dir="rtl" className="mt-3 text-center font-urdu text-[26px] leading-[2.1] text-champagne max-m:text-xl max-m:leading-[2.1]">{data.headline}</p>}
    </header>
  );
}

export async function Highlights({ items }) {
  const t = await getT();
  return (
    <ul className="grid grid-cols-4 gap-3 max-m:grid-cols-2">
      {items.filter((item) => item.value).map((item) => (
        <li key={item.label} className="rounded-xl border border-[#ece4d4] bg-[#fbf8f1] px-4 py-3">
          <p className="flex items-center justify-between gap-2 text-[11px] text-muted">
            {t(item.label)}
            <Urdu as="span" className="text-[11px] leading-6 text-[#9b712b] max-m:hidden">{item.ur}</Urdu>
          </p>
          <p className="font-nunito text-[19px] font-extrabold leading-tight text-navy max-m:text-base">{t(item.value)}</p>
        </li>
      ))}
    </ul>
  );
}

// Section A. The candidate's own details, always kept apart from Section B.
export async function CandidateSection({ data, columns }) {
  const t = await getT();
  return (
    <section aria-label={t('Candidate information')}>
      <SectionHeading letter="A" title={t('Candidate information')} ur="امیدوار کی معلومات" />
      <Highlights items={data.highlights} />
      <div className="mt-5"><InfoGrid rows={data.candidate} columns={columns} /></div>
      {data.residence.length > 0 && (<><Subheading>{t('Residence')}</Subheading><InfoGrid rows={data.residence} columns={columns} /></>)}
      {data.family.length > 0 && (<><Subheading>{t('Family details')}</Subheading><InfoGrid rows={data.family} columns={columns} /></>)}
      {data.familyBackground && (<><Subheading>{t('Family background')}</Subheading><BidiText text={data.familyBackground} className="text-[#536471]" /></>)}
      {data.about && (<><Subheading>{t('About the candidate')}</Subheading><BidiText text={data.about} className="text-[#536471]" /></>)}
      {data.contact.length > 0 && (
        <div className="mt-7 rounded-xl bg-[#f8f4eb] p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy"><FaLock aria-hidden="true" /> {t('Private contact details')}</h3>
          <InfoGrid rows={data.contact} columns={columns} />
        </div>
      )}
    </section>
  );
}

// Section B. The partner demand: free text first, structured preferences beneath it.
export async function PartnerSection({ data }) {
  const t = await getT();
  const { demand, rows } = data.partner;
  if (!demand && rows.length === 0) return null;
  return (
    <section aria-label={t('Partner requirements')} className="border-t-[3px] border-gold bg-[#fbf8f1] px-9 py-9 max-m:px-5 max-m:py-7">
      <div className="mb-6 text-center">
        <span aria-hidden="true" className="mx-auto mb-2 grid size-8 place-items-center rounded-full border border-gold font-nunito text-[13px] font-extrabold text-[#9b712b]">{t('B')}</span>
        <Urdu as="h2" className="text-center text-[24px] leading-[2.1] text-navy max-m:text-xl max-m:leading-[2.1]">رشتے کی ضروریات</Urdu>
        <p className="text-[11px] font-bold uppercase tracking-[2.4px] text-bronze">{t('Partner requirements')}</p>
      </div>
      {demand && <BidiText text={demand} className="mx-auto max-w-[860px] rounded-2xl border border-[#ece4d4] bg-white px-7 py-5 text-navy max-m:px-5" urduClass="text-[19px] leading-[2.6] max-m:text-[17px]" />}
      {rows.length > 0 && <div className="mx-auto mt-5 max-w-[860px]"><InfoGrid rows={rows} columns="grid-cols-2 max-m:grid-cols-1" /></div>}
    </section>
  );
}

export function NameLine({ data }) {
  return (
    <h1 className="text-[28px] font-semibold leading-tight text-navy">
      {data.name}
      {data.verified && <VerifiedBadge className="ms-2 text-[21px]" />}
    </h1>
  );
}
