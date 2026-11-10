import Link from 'next/link';
import { FaBriefcase, FaCircleInfo, FaEarthAmericas, FaHandshake, FaMosque, FaUsers, FaWhatsapp } from 'react-icons/fa6';
import { container, GlowButton, SectionHeader, sectionX } from './HomeUi';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';
import { whatsappDigits } from '@/lib/fees.js';

const ICONS = [FaUsers, FaBriefcase, FaMosque, FaEarthAmericas];

// "Offering Rishta Services": the bureau's own consultancy plans, read from the official fee structure
// that the administrator edits under Consultancy fees. Registration and finalization fees are paired
// by their category.
export async function RishtaServices({ fees }) {
  const t = await getT();
  const plans = fees.registration.map((row, index) => ({
    category: row.category,
    registration: row.fee,
    finalization: fees.finalization.find((item) => item.category === row.category)?.fee ?? fees.finalization[index]?.fee ?? null,
    Icon: ICONS[index % ICONS.length],
  }));
  const whatsapp = whatsappDigits(fees.whatsapp);
  return (
    <section id="how-it-works" className={`scroll-mt-[90px] overflow-x-clip bg-[linear-gradient(180deg,#f6f1e7,#fbf8f2)] py-20 font-sans text-navy max-sm:py-12 ${sectionX}`}>
      <div className={container}>
        <Reveal y={20}><SectionHeader title={t('Offering Rishta Services')} sub={t('Our marriage consultancy plans and official fees')} /></Reveal>

        <div className="grid grid-cols-4 gap-6 max-n:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5">
          {plans.map(({ category, registration, finalization, Icon }, index) => (
            <Reveal key={category} y={24} delay={Math.min(index, 3) * 0.08} className="h-full">
              <article className="flex h-full flex-col rounded-[20px] border border-[#d4af3726] bg-[#fcf9f2] px-5 py-[25px] text-center shadow-[0_8px_20px_#0000000a] transition-[transform,box-shadow,border-color] duration-[400ms] hover:scale-[1.01] hover:border-[#f8e6b8] hover:shadow-[0_15px_35px_#062b4e1a]">
                <span className="mx-auto mb-5 grid size-[120px] place-items-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_25%,#ffffff,#f1e3c3)] text-[44px] text-[#a17a33] shadow-[0_6px_18px_#062b4e1f] max-sm:size-[100px] max-sm:text-[38px]">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="mb-3 text-[17px] font-bold leading-snug text-[#1a1a1a]">{t(category)}</h3>
                <dl className="mt-auto grid gap-2 rounded-2xl bg-white p-3 text-start shadow-[inset_0_0_0_1px_#efe6d5]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-muted">{t('Registration fee')}</dt>
                    <dd className="whitespace-nowrap text-[15px] font-bold text-navy">{registration}</dd>
                  </div>
                  {finalization && (
                    <div className="flex items-center justify-between gap-3 border-t border-[#f1ead9] pt-2">
                      <dt className="text-[13px] text-muted">{t('Finalization fee')}</dt>
                      <dd className="whitespace-nowrap text-[15px] font-bold text-[#a17a33]">{finalization}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 grid gap-2">
                  <Link href="/submit-profile" className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-bold text-white no-underline shadow-[0_6px_14px_#062b4e33] transition-colors hover:bg-dark hover:text-white">{t('Register Now')}</Link>
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalam-o-Alaikum, I would like to know about: ${category}`)}`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#1f8a3a40] bg-white px-5 text-sm font-semibold text-[#14703a] no-underline transition-colors hover:bg-[#eef8f1] hover:text-[#14703a]">
                      <FaWhatsapp aria-hidden="true" /> {t('Ask on WhatsApp')}
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal y={16} className="mx-auto mt-8 flex max-w-[860px] items-start gap-3 rounded-2xl border border-[#e8dcc3] bg-white/70 px-5 py-4 text-[14.5px] leading-6 text-[#47566a] max-sm:text-[13.5px]">
          <FaCircleInfo aria-hidden="true" className="mt-1 shrink-0 text-gold" />
          <p>{t('Registration fees are non-refundable. The finalization fee is paid only after the rishta is finalized.')}</p>
        </Reveal>

        <div className="mt-9 flex justify-center">
          <GlowButton href="/fees"><FaHandshake aria-hidden="true" className="text-gold" /> <span>{t('View Full Fee Structure')}</span></GlowButton>
        </div>
      </div>
    </section>
  );
}
