import Image from 'next/image';
import { FaBriefcase, FaLocationDot, FaUserTie, FaWhatsapp } from 'react-icons/fa6';
import { container, SectionHeader, sectionX } from './HomeUi';
import { Slider } from './Slider';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';

const MESSAGE = 'Hello, I would like to consult with you regarding marriage services.';

/**
 * "Hire Personal Matchmaking Consultant": the bureau's public consultants as cards, each with a
 * Contact Consultant button that opens WhatsApp with a ready message. A consultant without a WhatsApp
 * number of their own is reached through the bureau's official WhatsApp.
 */
export async function HomeConsultants({ consultants, whatsapp }) {
  const t = await getT();
  if (consultants.length === 0) return null;
  return (
    <section id="consultants" className={`scroll-mt-[90px] overflow-x-clip bg-[linear-gradient(180deg,#fbf7f0,#f5eee1)] py-[60px] font-sans text-navy max-sm:py-11 ${sectionX}`}>
      <div className={container}>
        <Reveal y={20}>
          <SectionHeader title={t('Hire Personal Matchmaking Consultant')} />
          <p className="mx-auto -mt-4 mb-10 max-w-[840px] text-center text-[17px] leading-[1.65] text-[#3d4a5a] max-sm:mb-7 max-sm:text-[15px]">
            {t('Our consultants work with you personally: they understand your family’s requirements, suggest suitable proposals and stay with you until the rishta is settled.')}
          </p>
        </Reveal>
        <Slider label={t('Matchmaking consultants')} perView={4}>
          {consultants.map((consultant) => {
            const number = (consultant.whatsapp || whatsapp || '').replace(/\D/g, '');
            const tags = String(consultant.languages ?? '').split(/[,/]/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
            return (
              <article key={consultant.id} className="relative flex h-full flex-col items-center rounded-[14px] border border-[#ecd9c9] bg-[#fdf9f6] px-5 pb-6 pt-12 text-center shadow-[0_6px_18px_#062b4e0d] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_#062b4e1f]">
                {consultant.city && (
                  <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#1f8a3a] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <FaLocationDot aria-hidden="true" className="text-[9px]" /> {t(consultant.city)}
                  </span>
                )}
                <span className="relative mb-4 grid size-[104px] place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_25%,#c99432,#062b4e)] p-[3px] shadow-[0_6px_16px_#062b4e33]">
                  <span className="relative block size-full overflow-hidden rounded-full bg-[#efe6d5]">
                    {consultant.photo ? (
                      <Image src={`/media/consultants/${consultant.photo}`} alt={consultant.display_name} fill sizes="104px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-[38px] text-[#a17a33]"><FaUserTie aria-hidden="true" /></span>
                    )}
                  </span>
                </span>
                <h3 className="text-[17px] font-bold capitalize leading-snug text-[#1a1a1a]">{consultant.display_name}</h3>
                {consultant.title && <p className="mt-0.5 text-[13.5px] font-semibold capitalize text-[#a17a33]">{t(consultant.title)}</p>}
                {consultant.experience_years > 0 && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-navy"><FaBriefcase aria-hidden="true" className="text-[11px] text-[#a17a33]" /> {t('{count} Years Experience', { count: consultant.experience_years })}</p>
                )}
                {tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {tags.map((tag) => <li key={tag} className="rounded border border-[#e2d6c4] bg-white px-2 py-0.5 text-[12px] capitalize text-[#444]">{t(tag)}</li>)}
                  </ul>
                )}
                <div className="mt-auto w-full pt-5">
                  {number ? (
                    <a href={`https://wa.me/${number}?text=${encodeURIComponent(t(MESSAGE))}`} target="_blank" rel="noopener" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 text-[14px] font-semibold text-white no-underline shadow-[0_6px_14px_#062b4e33] transition-colors hover:bg-[#1f8a3a] hover:text-white">
                      <FaWhatsapp aria-hidden="true" className="text-[17px]" /> {t('Contact Consultant')}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </Slider>
      </div>
    </section>
  );
}
