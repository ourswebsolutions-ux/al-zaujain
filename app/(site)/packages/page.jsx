import { FaCircleInfo } from 'react-icons/fa6';
import { GradientHeading, Label, Ornament } from '@/components/home/HomeUi';
import { Slider } from '@/components/home/Slider';
import { PackageCard } from '@/components/packages/PackageCard';
import { Urdu } from '@/components/ui/Text';
import { activePackages, packageView, unlockCost } from '@/lib/credits.js';
import { getFees } from '@/lib/fees.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rishta Packages', description: 'Al Zaujain marriage consultancy packages and premium profile credits, with clear prices.' };

// "Rs. 25,000" → 25000
const amount = (fee) => Number((/\d[\d,]*(\.\d+)?/.exec(String(fee ?? ''))?.[0] ?? '0').replace(/,/g, '')) || 0;

function planName(category, index) {
  if (/gulf|uae|saudi|qatar|oman/i.test(category)) return 'Gulf';
  if (/overseas|uk|usa|canada|abroad/i.test(category)) return 'Overseas';
  if (/doctor|engineer|govt|government|business|second marriage/i.test(category)) return 'Professional';
  return index === 0 ? 'Standard' : `Plan ${index + 1}`;
}

function Heading({ title, urdu, text }) {
  return (
    <div className="mx-auto mb-10 max-w-[900px] text-center max-sm:mb-7">
      <h2 className="text-[30px] font-bold leading-tight text-[#111] max-sm:text-[23px]">“ {title} ”</h2>
      {urdu && <Urdu keep as="p" className="mt-1 text-[26px] leading-[2] text-[#111] max-sm:text-[21px]">{urdu}</Urdu>}
      {text && <p className="mt-3 text-[17px] font-semibold leading-relaxed text-[#9b712b] max-sm:text-[15px]">{text}</p>}
    </div>
  );
}

// The packages: the bureau's consultancy packages (from the official fee structure) and the premium
// profile credit packages the administrator sells. Each set is a slider: several cards on a computer,
// one at a time to swipe through on a phone.
export default async function PackagesPage() {
  const t = await getT();
  const [fees, packages, cost] = await Promise.all([getFees(), activePackages(), unlockCost()]);
  const plans = fees.registration.map((row, index) => ({
    category: row.category,
    registration: row.fee,
    finalization: fees.finalization.find((item) => item.category === row.category)?.fee ?? fees.finalization[index]?.fee ?? '',
    name: planName(row.category, index),
  }));
  const credits = packages.map(packageView);
  return (
    <main className="bg-[linear-gradient(180deg,#fbf6ee,#f6efe2)] font-sans text-navy">
      <section className="px-[5%] pb-6 pt-14 text-center max-sm:px-4 max-sm:pt-10">
        <Label>{t('Welcome to {company}', { company: 'Al Zaujain Marriage Bureau' })}</Label>
        <GradientHeading as="h1" className="mt-2 text-[52px] leading-tight max-sm:text-[34px]">{t('Rishta Packages')}</GradientHeading>
        <Urdu keep as="p" className="mt-1 text-[34px] leading-[1.9] text-[#9b712b] max-sm:text-[26px]">رشتہ پیکجز</Urdu>
        <Ornament className="mt-2" />
        <div className="mx-auto mt-6 max-w-[860px] text-start text-[17px] leading-[1.7] text-[#2f3b4a] max-sm:text-[15px]">
          <p>{t('Al Zaujain offers two kinds of packages. Consultancy packages, where our consultants personally find and present suitable proposals for your family, and Premium Profile Credits, to open premium profiles on this website yourself.')}</p>
        </div>
        <nav aria-label={t('Package types')} className="mx-auto mt-8 flex max-w-[900px] flex-wrap justify-center gap-4">
          <a href="#consultancy" className="min-w-[260px] rounded-md bg-[linear-gradient(135deg,#062b4e_55%,#0d3d6b)] px-7 py-4 text-[16px] font-semibold tracking-[1px] text-white no-underline shadow-[0_12px_26px_#062b4e40] ring-1 ring-[#c99432] transition-transform hover:-translate-y-0.5 hover:text-white max-sm:min-w-0 max-sm:flex-1">
            {t('Consultancy Packages')}<Urdu keep as="span" className="block text-[15px] leading-[2] text-champagne">کنسلٹنسی پیکجز</Urdu>
          </a>
          {credits.length > 0 && (
            <a href="#credits" className="min-w-[260px] rounded-md bg-[linear-gradient(135deg,#9b712b_55%,#c99432)] px-7 py-4 text-[16px] font-semibold tracking-[1px] text-white no-underline shadow-[0_12px_26px_#9b712b40] ring-1 ring-[#062b4e33] transition-transform hover:-translate-y-0.5 hover:text-white max-sm:min-w-0 max-sm:flex-1">
              {t('Premium Profile Credits')}<Urdu keep as="span" className="block text-[15px] leading-[2] text-white/90">پریمیم پروفائل کریڈٹس</Urdu>
            </a>
          )}
        </nav>
      </section>

      <section id="consultancy" className="scroll-mt-24 px-[5%] py-12 max-sm:px-4">
        <div className="mx-auto max-w-[1296px]">
          <Heading title={t('Rishta Consultancy Packages')} urdu="رشتہ کنسلٹنسی پیکجز" text={t('The registration fee is paid when you register and is non-refundable. The finalization fee is paid only after the rishta is finalized.')} />
          <Slider label={t('Consultancy packages')} perView={3}>
            {plans.map((plan, index) => (
              <PackageCard
                key={plan.category}
                t={t}
                tier={index}
                name={plan.name}
                price={amount(plan.registration)}
                priceNote="Registration Fee · Non-Refundable"
                ribbon={/overseas/i.test(plan.name) ? 'International' : null}
                rows={[
                  { label: 'For', value: plan.category },
                  { label: 'Registration Fee', value: plan.registration, ur: `رجسٹریشن فیس: ${plan.registration}` },
                  { label: 'Finalization Fee', value: plan.finalization, ur: `رشتہ طے ہونے کی فیس: ${plan.finalization}` },
                  { label: 'Finalization Fee Paid', value: 'After The Rishta Is Finalized', ur: 'رشتہ طے ہونے کے بعد' },
                ]}
                cta="Register Now"
                href="/submit-profile"
              />
            ))}
          </Slider>
        </div>
      </section>

      {credits.length > 0 && (
        <section id="credits" className="scroll-mt-24 px-[5%] pb-16 pt-6 max-sm:px-4">
          <div className="mx-auto max-w-[1296px]">
            <Heading title={t('Premium Profile Credits')} urdu="پریمیم پروفائل کریڈٹس" text={t('Each credit opens one Premium profile’s photo and contact details. An opened profile stays open for you.')} />
            <Slider label={t('Premium profile credit packages')} perView={3}>
              {credits.map((pack, index) => {
                const unlocks = Math.floor(pack.credits / cost);
                return (
                  <PackageCard
                    key={pack.id}
                    t={t}
                    tier={index}
                    name={pack.name}
                    price={pack.price}
                    priceNote="One-Time Payment"
                    ribbon={pack.featured ? 'Featured' : null}
                    rows={[
                      { label: 'Premium Credits', value: String(pack.credits), ur: `پریمیم کریڈٹس: ${pack.credits}` },
                      { label: 'Premium Profiles You Can Open', value: String(unlocks), ur: `کھلنے والی پریمیم پروفائلز: ${unlocks}` },
                      { label: 'Opened Profiles', value: 'Stay Open For You', ur: 'کھلی پروفائل ہمیشہ کھلی رہتی ہے' },
                      ...(pack.description ? [{ label: 'Details', value: pack.description }] : []),
                    ]}
                    cta="Buy Now"
                    href={`/dashboard/credits/buy?package=${pack.id}`}
                  />
                );
              })}
            </Slider>
          </div>
        </section>
      )}

      <section className="px-[5%] pb-16 max-sm:px-4">
        <div className="mx-auto flex max-w-[900px] items-start gap-3 rounded-2xl border border-[#e8dcc3] bg-white/80 px-5 py-4 text-[14.5px] leading-6 text-[#47566a]">
          <FaCircleInfo aria-hidden="true" className="mt-1 shrink-0 text-gold" />
          <p>{t('Consultancy fees are separate from Premium Profile Credits. Our team will tell you which package fits your family; contact us on WhatsApp any time.')}</p>
        </div>
      </section>
    </main>
  );
}
