import { FaUsers } from 'react-icons/fa6';
import { CONSULTANT_CARD_SLIDE, ConsultantTile } from '@/components/profile/ConsultantTile';
import { container, GlowButton, GradientHeading, Label, Ornament, sectionX } from './HomeUi';
import { Slider } from './Slider';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';

/**
 * "Hire Personal Matchmaking Consultant", laid out like the reference: a label, the heading, a short
 * paragraph, then consultant cards with an Online/Offline badge (from their working hours, Pakistan
 * time), photo, name, experience, rating, specialities, hours and Connect Now on WhatsApp.
 */
export async function HomeConsultants({ consultants, whatsapp }) {
  const t = await getT();
  if (consultants.length === 0) return null;
  const now = new Date();
  return (
    <section id="consultants" className={`scroll-mt-[90px] overflow-x-clip bg-[#f8f1e6] pb-16 pt-12 font-sans text-navy max-sm:pb-12 max-sm:pt-10 ${sectionX}`}>
      <div className={container}>
        <Reveal y={20} className="mb-16 text-center max-sm:mb-9">
          <Label className="mb-3">{t('Expert Team')}</Label>
          <GradientHeading className="text-[42px] leading-[1.2] max-p:text-[34px] max-sm:text-[27px]">{t('Hire Personal Matchmaking Consultant')}</GradientHeading>
          <Ornament className="mb-5 mt-5" />
          <p className="mx-auto max-w-[840px] text-[17px] leading-[1.6] text-[#3d4a5a] max-sm:text-[15px]">
            {t('Our consultants work with you personally: they understand your family’s requirements, suggest suitable proposals and stay with you until the rishta is settled.')}
          </p>
        </Reveal>

        <Slider label={t('Matchmaking consultants')} itemClass={CONSULTANT_CARD_SLIDE} className="mx-auto max-w-[1310px]">
          {consultants.map((consultant) => <ConsultantTile key={consultant.id} consultant={consultant} whatsapp={whatsapp} t={t} now={now} />)}
        </Slider>

        <div className="mt-6 flex justify-center">
          <GlowButton href="/consultants"><FaUsers aria-hidden="true" className="text-gold" /> <span>{t('See All Consultants')}</span></GlowButton>
        </div>
      </div>
    </section>
  );
}
