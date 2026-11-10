import Image from 'next/image';
import { FaClockRotateLeft, FaComments, FaRegClock, FaStar, FaStarHalfStroke, FaUserTie, FaUsers } from 'react-icons/fa6';
import { FaRegStar } from 'react-icons/fa';
import { container, GlowButton, GradientHeading, Label, Ornament, sectionX } from './HomeUi';
import { Slider } from './Slider';
import { Reveal } from '@/components/ui/Reveal';
import { availability } from '@/lib/consultants.js';
import { getT } from '@/lib/i18n/server.js';

const MESSAGE = 'Hello, I would like to consult with you regarding marriage services.';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-[3px] text-[13px] text-[#f5b301]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (rating >= n ? <FaStar key={n} /> : rating >= n - 0.5 ? <FaStarHalfStroke key={n} /> : <FaRegStar key={n} />))}
    </span>
  );
}

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

        <Slider label={t('Matchmaking consultants')} perView={4} className="mx-auto max-w-[1310px]">
          {consultants.map((consultant) => {
            const number = (consultant.whatsapp || whatsapp || '').replace(/\D/g, '');
            const tags = String(consultant.specialties ?? '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4);
            const rating = consultant.rating == null ? null : Number(consultant.rating);
            const { hours, online } = availability(consultant, now);
            return (
              <article key={consultant.id} className="relative flex h-full flex-col items-center rounded-[14px] border border-[#e9cfa0] bg-[#fdf9f3] px-4 pb-6 pt-[70px] text-center shadow-[0_2px_10px_#062b4e0a] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_#062b4e1a] max-sm:pt-16">
                {online !== null && (
                  <span className={`absolute end-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white shadow-[0_0_0_2px_#fff,0_2px_6px_#0000002e] ${online ? 'bg-[#22a35a]' : 'bg-[#7c7c7c]'}`}>
                    <FaClockRotateLeft aria-hidden="true" className="text-[10px]" /> {t(online ? 'Online' : 'Offline')}
                  </span>
                )}
                <span className={`relative mb-5 grid size-[104px] place-items-center rounded-full ${rating >= 4.8 ? 'bg-[linear-gradient(135deg,#ffe08a,#e4a92a)] p-1 shadow-[0_0_18px_#f5c24a99]' : ''}`}>
                  <span className="relative block size-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,#0d4a80,#062b4e)]">
                    {consultant.photo ? (
                      <Image src={`/media/consultants/${consultant.photo}`} alt={consultant.display_name} fill sizes="104px" className="object-cover object-top" />
                    ) : (
                      <span className="grid size-full place-items-center text-[40px] text-champagne"><FaUserTie aria-hidden="true" /></span>
                    )}
                  </span>
                </span>
                <h3 className="text-[17px] font-bold capitalize text-[#1a1a1a]">{consultant.display_name}</h3>
                {consultant.experience_years > 0 && <p className="mt-0.5 text-[13.5px] font-bold text-[#1a1a1a]">{t('{count} Years Exp.', { count: consultant.experience_years })}</p>}
                {rating && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13.5px] font-bold text-[#1a1a1a]">
                    <span>{rating.toFixed(1)}</span> <Stars rating={rating} />
                    <span className="sr-only">{t('{rating} out of 5', { rating: rating.toFixed(1) })}</span>
                  </p>
                )}
                {tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {tags.map((tag) => <li key={tag} className="rounded-[3px] border border-[#e6c9cd] bg-white px-2 py-[3px] text-[12px] capitalize text-[#333]">{t(tag)}</li>)}
                  </ul>
                )}
                <div className="mt-auto flex flex-col items-center pt-5">
                  {hours && <p className="mb-2.5 inline-flex items-center gap-1.5 text-[13px] text-[#222]"><FaRegClock aria-hidden="true" className="text-[12px]" /> {hours}</p>}
                  {number && (
                    <a href={`https://wa.me/${number}?text=${encodeURIComponent(t(MESSAGE))}`} target="_blank" rel="noopener" aria-label={t('Connect with {name} on WhatsApp', { name: consultant.display_name })} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-navy px-4 text-[14px] font-semibold text-white no-underline shadow-[0_4px_10px_#062b4e33] transition-colors hover:bg-[#0d4a80] hover:text-white">
                      <FaComments aria-hidden="true" className="text-[15px]" /> {t('Connect Now')}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </Slider>

        <div className="mt-6 flex justify-center">
          <GlowButton href="/consultants"><FaUsers aria-hidden="true" className="text-gold" /> <span>{t('See All Consultants')}</span></GlowButton>
        </div>
      </div>
    </section>
  );
}
