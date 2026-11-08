import { FaCrown, FaWhatsapp } from 'react-icons/fa6';
import { ButtonLink } from '@/components/ui/Button';
import { getT } from '@/lib/i18n/server.js';

// Premium proposals are introduced personally, so the candidate's own details are never shown.
export async function PremiumContact({ href }) {
  const t = await getT();
  return (
    <section className="mt-7 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#062b4e,#03223f)] p-6 text-white shadow-[0_18px_40px_#03223f2e] max-m:p-5">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.4px] text-champagne"><FaCrown aria-hidden="true" /> {t('Exclusive premium proposal')}</p>
      <p className="mb-5 max-w-[560px] text-[15px] leading-7">{t('Interested in this exclusive matrimonial proposal? Contact our Al Zaujain Marriage Consultant for further details and assistance.')}</p>
      <ButtonLink external tone="gold" href={href}><FaWhatsapp aria-hidden="true" /> {t('Contact for Premium Proposal')}</ButtonLink>
    </section>
  );
}
