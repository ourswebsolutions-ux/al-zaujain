import { FaArrowRight } from 'react-icons/fa6';
import { ProposalCard } from '@/components/profile/ProposalCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

export async function Featured({ profiles }) {
  const t = await getT();
  return (
    <section id="featured-proposals" className="scroll-mt-[15px] bg-cream px-[6%] py-[90px] font-nunito text-navy max-b:py-[60px]">
      <Reveal as="header" y={28} className="mb-9">
        <SectionTag>{t('A GLIMPSE OF YOUR NEXT CHAPTER')}</SectionTag>
        <div className="flex items-center justify-between gap-6 max-m:gap-2.5">
          <h2 className="my-[14px] text-[46px] font-extrabold leading-[55.2px] max-b:text-[30px] max-b:leading-9 max-[700px]:text-[clamp(16px,4vw,26px)] max-[700px]:leading-[1.2]">{t('Featured proposals')}</h2>
          <Urdu className="text-[17px] leading-[42.5px] text-[#9b712b] max-[700px]:text-[clamp(10px,2.7vw,16px)] max-[700px]:leading-[2.5]">ایک بامعنی رشتے کی طرف پہلا قدم</Urdu>
        </div>
        <p className="mb-4 text-base leading-[28.8px]">{t('Pakistan and overseas proposals, with the details that matter: education, work, family, and shared expectations.')}</p>
      </Reveal>
      {profiles.length > 0 ? (
        <>
          {/* Four cards per row on laptops and desktops, wide single cards on phones. */}
          <ul className="grid grid-cols-4 gap-5 max-[1180px]:grid-cols-3 max-p:grid-cols-2 max-sm:grid-cols-1">
            {profiles.map((profile, index) => (
              <Reveal as="li" key={profile.code} y={30} delay={Math.min(index, 3) * 0.06}><ProposalCard profile={profile} tag={profile.featured ? 'Featured' : undefined} /></Reveal>
            ))}
          </ul>
          <div className="mt-8 flex justify-center"><ButtonLink href="/proposals">{t('View all proposals')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></ButtonLink></div>
        </>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-muted">{t('New proposals will appear here soon.')}</p>
      )}
    </section>
  );
}
