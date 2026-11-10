import Image from 'next/image';
import { FaCircleInfo, FaEnvelope, FaEarthAsia, FaWhatsapp } from 'react-icons/fa6';
import { FeePlans } from '@/components/home/FeePlans';
import { PageHeading } from '@/components/listing/PageHeading';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { getFees, whatsappDigits } from '@/lib/fees.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Consultancy fee structure', description: 'Official Al Zaujain marriage consultancy fees: advance registration and rishta finalization fees for Pakistan and overseas proposals.' };

export default async function FeesPage() {
  const t = await getT();
  const fees = await getFees();
  const whatsapp = whatsappDigits(fees.whatsapp);
  return (
    <main>
      <PageHeading tag="OFFICIAL CONSULTANCY FEES" title="Fee structure" urdu="فیس کی تفصیل" text="The Al Zaujain marriage consultancy fees for Pakistan and international proposals." />
      <div className="mx-auto grid max-w-[1296px] gap-8 px-[5%] py-12 max-sm:px-4">
        <Reveal className="flex flex-wrap items-center gap-5 rounded-[22px] border border-[#ddcfb1] bg-[#f8f4eb] p-7 max-m:p-5">
          <Image src="/images/logo.png" alt={t('Al Zaujain logo')} width={72} height={72} className="size-[72px] rounded-full bg-white" />
          <div className="min-w-0 flex-1">
            <p className="font-nunito text-2xl font-extrabold tracking-[0.5px] text-navy max-m:text-xl">{fees.company}</p>
            <p className="mt-1 text-xs font-bold tracking-[1.2px] text-[#806126]">{[fees.registered, fees.city].filter(Boolean).join(' · ')}</p>
            <p className="mt-2 text-[13px] text-muted">{[fees.ntn, fees.ceo].filter(Boolean).join(' · ')}</p>
          </div>
        </Reveal>

        <FeePlans fees={fees} />

        <div className="grid grid-cols-2 gap-6 max-t:grid-cols-1">
          <section className="rounded-[22px] border border-line bg-white p-7 max-m:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy"><FaCircleInfo aria-hidden="true" className="text-[#a67b2e]" /> {t('Please note')}</h2>
            <ul className="grid gap-3 text-sm leading-6 text-[#536471]">
              <li>{t('Advance registration fees are non-refundable.')}</li>
              <li>{t('Rishta finalization fees are payable after the rishta is finalized.')}</li>
              <li>{t('These consultancy fees are separate from Premium Profile Packages, which are bought on the website to unlock premium profiles.')}</li>
            </ul>
          </section>
          <section className="rounded-[22px] border border-line bg-white p-7 max-m:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-navy"><FaEarthAsia aria-hidden="true" className="text-[#a67b2e]" /> {t('International services')}</h2>
            <p className="text-sm leading-7 text-[#536471]">{t(fees.countries)}</p>
          </section>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-5 rounded-[22px] bg-navy p-7 text-white max-m:p-5">
          <div>
            <h2 className="text-xl font-bold">{t('Speak to our team about your proposal')}</h2>
            <p className="mt-1 text-sm text-[#c7d3dd]">{t('We will tell you which category fits your family and answer any questions.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {fees.whatsapp && <ButtonLink external tone="gold" href={`https://wa.me/${whatsapp}`}><FaWhatsapp aria-hidden="true" /> <span dir="ltr">{fees.whatsapp}</span></ButtonLink>}
            {fees.email && <ButtonLink external tone="outline" href={`mailto:${fees.email}`}><FaEnvelope aria-hidden="true" /> {fees.email}</ButtonLink>}
          </div>
        </section>
      </div>
    </main>
  );
}
