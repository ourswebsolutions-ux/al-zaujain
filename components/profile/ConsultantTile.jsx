import { FaClockRotateLeft, FaComments, FaIdCard, FaLocationDot, FaRegClock, FaStar, FaStarHalfStroke, FaUserTie } from 'react-icons/fa6';
import { FaRegStar } from 'react-icons/fa';
import { availability } from '@/lib/consultants.js';

const MESSAGE = 'Hello, I would like to consult with you regarding marriage services.';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-[3px] text-[13px] text-[#f5b301]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (rating >= n ? <FaStar key={n} /> : rating >= n - 0.5 ? <FaStarHalfStroke key={n} /> : <FaRegStar key={n} />))}
    </span>
  );
}

/**
 * One consultant card, the same on the homepage and the Consultants page: a large photo that fills the
 * top (kept to the face, like the profile photos) with the Online/Offline badge, then the name and
 * designation, and the details families asked for: city, registration ID, rating and available timing.
 * Connect Now opens WhatsApp with a ready message (the bureau's number when the consultant has none).
 */
// One size for the consultant card wherever it appears (homepage slider and the Consultants page).
export const CONSULTANT_CARD_SLIDE = 'basis-[300px] max-sm:basis-[86%]';
export const CONSULTANT_CARD_GRID = 'grid justify-center gap-6 [grid-template-columns:repeat(auto-fill,300px)] max-sm:[grid-template-columns:minmax(0,1fr)]';

function Detail({ icon: Icon, label, children }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-dashed border-[#eadfca] py-2 last:border-0">
      <Icon aria-hidden="true" className="mt-[3px] shrink-0 text-[13px] text-[#9b712b]" />
      <span className="min-w-0 text-start">
        <span className="block text-[11px] font-semibold text-[#8a6a2c]">{label}</span>
        <span className="block text-[14px] font-semibold leading-snug text-navy">{children}</span>
      </span>
    </li>
  );
}

export function ConsultantTile({ consultant, whatsapp, t, now = new Date() }) {
  const number = (consultant.whatsapp || whatsapp || '').replace(/\D/g, '');
  const rating = consultant.rating == null ? null : Number(consultant.rating);
  const { hours, online } = availability(consultant, now);
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-[#e9cfa0] bg-white shadow-[0_6px_18px_#062b4e12] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_#062b4e1f]">
      <div className="relative aspect-[4/4.2] w-full bg-[radial-gradient(circle_at_50%_40%,#0d4a80,#062b4e)]">
        {consultant.photo ? (
          // Uploaded photos skip the image optimizer, whose cache is shared by everyone.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/consultants/${consultant.photo}`} alt={consultant.display_name} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
        ) : (
          <span className="grid size-full place-items-center text-[64px] text-champagne"><FaUserTie aria-hidden="true" /></span>
        )}
        {online !== null && (
          <span className={`absolute end-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white shadow-[0_0_0_2px_#fff,0_2px_6px_#0000002e] ${online ? 'bg-[#22a35a]' : 'bg-[#7c7c7c]'}`}>
            <FaClockRotateLeft aria-hidden="true" className="text-[10px]" /> {t(online ? 'Online' : 'Offline')}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        <h3 className="text-[18px] font-bold capitalize leading-tight text-navy">{consultant.display_name}</h3>
        {consultant.title && <p className="mt-0.5 text-[13px] font-semibold capitalize text-[#9b712b]">{t(consultant.title)}</p>}
        <ul className="mb-4 mt-3">
          {consultant.city && <Detail icon={FaLocationDot} label={t('City')}>{t(consultant.city)}</Detail>}
          {consultant.registration_id && <Detail icon={FaIdCard} label={t('Registration ID')}><span data-plain>{consultant.registration_id}</span></Detail>}
          {rating && (
            <Detail icon={FaStar} label={t('Rating')}>
              <span className="inline-flex items-center gap-1.5">{rating.toFixed(1)} <Stars rating={rating} /></span>
              <span className="sr-only">{t('{rating} out of 5', { rating: rating.toFixed(1) })}</span>
            </Detail>
          )}
          {hours && <Detail icon={FaRegClock} label={t('Available timing')}>{hours}</Detail>}
        </ul>
        {number && (
          <a href={`https://wa.me/${number}?text=${encodeURIComponent(t(MESSAGE))}`} target="_blank" rel="noopener" aria-label={t('Connect with {name} on WhatsApp', { name: consultant.display_name })} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 text-[14.5px] font-semibold text-white no-underline shadow-[0_4px_10px_#062b4e33] transition-colors hover:bg-[#0d4a80] hover:text-white">
            <FaComments aria-hidden="true" className="text-[15px]" /> {t('Connect Now')}
          </a>
        )}
      </div>
    </article>
  );
}
