import { FaCircleInfo, FaHandshake } from 'react-icons/fa6';
import { FeePlans } from './FeePlans';
import { container, GlowButton, SectionHeader, sectionX } from './HomeUi';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';

// "Offering Rishta Services": the bureau's own consultancy plans, read from the official fee structure
// that the administrator edits under Consultancy fees.
export async function RishtaServices({ fees }) {
  const t = await getT();
  return (
    <section id="how-it-works" className={`scroll-mt-[90px] overflow-x-clip bg-[linear-gradient(180deg,#f6f1e7,#fbf8f2)] py-20 font-sans text-navy max-sm:py-12 ${sectionX}`}>
      <div className={container}>
        <Reveal y={20}><SectionHeader title={t('Offering Rishta Services')} sub={t('Our marriage consultancy plans and official fees')} /></Reveal>
        <FeePlans fees={fees} />

        <Reveal y={16} className="mx-auto mt-9 flex max-w-[860px] items-start gap-3 rounded-2xl border border-[#e8dcc3] bg-white/80 px-5 py-4 text-[14.5px] leading-6 text-[#47566a] max-sm:text-[13.5px]">
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
