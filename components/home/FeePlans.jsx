import Link from 'next/link';
import { FaArrowRight, FaBriefcase, FaCircleCheck, FaEarthAmericas, FaHandshake, FaMosque, FaUsers, FaWhatsapp } from 'react-icons/fa6';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';
import { whatsappDigits } from '@/lib/fees.js';

// A short plan name and icon for each official fee category, read from its wording so it follows
// whatever the administrator writes under Consultancy fees.
function planOf(category, index) {
  if (/gulf|uae|saudi|qatar|oman/i.test(category)) return { name: 'Gulf Plan', Icon: FaMosque };
  if (/overseas|uk|usa|canada|abroad/i.test(category)) return { name: 'Overseas Plan', Icon: FaEarthAmericas, featured: true };
  if (/doctor|engineer|govt|government|business|second marriage/i.test(category)) return { name: 'Professional Plan', Icon: FaBriefcase };
  return index === 0 ? { name: 'Standard Plan', Icon: FaUsers } : { name: `Plan ${index + 1}`, Icon: FaHandshake };
}

// "Rs. 25,000" → ["Rs", "25,000"], so the amount can be large and the currency small.
const money = (fee) => {
  const match = /^\s*(rs\.?|pkr)\s*(.+)$/i.exec(fee ?? '');
  return match ? ['Rs', match[2]] : ['', fee ?? ''];
};

/**
 * The official consultancy fees as pricing cards: one per category, with the registration fee as the
 * price and the finalization fee (paid only after the rishta) beneath it. Used on the homepage and the
 * fees page.
 */
export async function FeePlans({ fees }) {
  const t = await getT();
  const whatsapp = whatsappDigits(fees.whatsapp);
  const plans = fees.registration.map((row, index) => ({
    category: row.category,
    registration: row.fee,
    finalization: fees.finalization.find((item) => item.category === row.category)?.fee ?? fees.finalization[index]?.fee ?? null,
    number: String(index + 1).padStart(2, '0'),
    ...planOf(row.category, index),
  }));
  return (
    <div className="grid grid-cols-4 items-stretch gap-6 max-n:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5">
      {plans.map(({ category, registration, finalization, number, name, Icon, featured }, index) => {
        const [currency, amount] = money(registration);
        const [finCurrency, finAmount] = money(finalization);
        return (
          <Reveal key={category} y={24} delay={Math.min(index, 3) * 0.08} className="h-full">
            <article className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 max-sm:p-5 ${featured ? 'border-[#c99432] bg-[linear-gradient(160deg,#0a3a66_0%,#062b4e_55%,#03223f_100%)] text-white shadow-[0_22px_50px_#062b4e40] hover:shadow-[0_28px_60px_#062b4e59]' : 'border-[#e8dfcc] bg-white text-navy shadow-[0_12px_32px_#062b4e10] hover:shadow-[0_20px_44px_#062b4e1f]'}`}>
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${featured ? 'bg-[linear-gradient(90deg,#f4d889,#c99432)]' : 'bg-[linear-gradient(90deg,#062b4e,#c99432)]'}`} />
              {featured && <span className="absolute end-6 top-1 rounded-b-xl bg-[linear-gradient(135deg,#f4d889,#c99432)] px-3 pb-1 pt-0.5 text-[10px] font-extrabold uppercase tracking-[.8px] text-dark">{t('International')}</span>}

              <div className="mb-5">
                <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.5px] ${featured ? 'text-champagne/80' : 'text-[#a17a33]'}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-xl text-[14px] ${featured ? 'bg-white/10 text-champagne' : 'bg-[#f6efe1] text-[#a17a33]'}`}><Icon aria-hidden="true" /></span>
                  {t('Plan {number}', { number })}
                </p>
                <h3 className="mt-3 whitespace-nowrap text-[21px] font-bold leading-tight max-[1300px]:text-[19px]">{t(name)}</h3>
              </div>

              <p className={`mb-6 min-h-[90px] text-[14px] leading-[1.6] max-n:min-h-[68px] max-sm:min-h-0 ${featured ? 'text-[#c7d3dd]' : 'text-[#55606e]'}`}>{t(category)}</p>

              <div className={`border-t pt-5 ${featured ? 'border-white/15' : 'border-[#efe7d6]'}`}>
                <p className={`text-[12px] font-semibold uppercase tracking-[1px] ${featured ? 'text-[#c7d3dd]' : 'text-muted'}`}>{t('Registration fee')}</p>
                <p className="mt-1 flex items-baseline gap-1.5" dir="ltr">
                  {currency && <span className={`text-[16px] font-bold ${featured ? 'text-champagne' : 'text-[#a17a33]'}`}>{currency}</span>}
                  <span className="text-[38px] font-extrabold leading-none tracking-[-1px] max-sm:text-[34px]">{amount}</span>
                </p>
                <p className={`mt-1.5 text-[12.5px] ${featured ? 'text-[#c7d3dd]' : 'text-muted'}`}>{t('One-time, non-refundable')}</p>
              </div>

              {finalization && (
                <div className={`mt-5 rounded-2xl px-4 py-3.5 ${featured ? 'bg-white/[.07] ring-1 ring-white/10' : 'bg-[#faf6ee] ring-1 ring-[#efe5d0]'}`}>
                  <p className={`text-[12px] font-semibold uppercase tracking-[1px] ${featured ? 'text-[#c7d3dd]' : 'text-muted'}`}>{t('Finalization fee')}</p>
                  <p className={`mt-0.5 text-[21px] font-extrabold leading-tight ${featured ? 'text-champagne' : 'text-[#a17a33]'}`} dir="ltr">{finCurrency} {finAmount}</p>
                  <p className={`mt-1 flex items-center gap-1.5 text-[12px] ${featured ? 'text-[#c7d3dd]' : 'text-muted'}`}><FaCircleCheck aria-hidden="true" className="shrink-0 text-[#2f9a55]" /> {t('Paid only after the rishta is finalized')}</p>
                </div>
              )}

              <div className="mt-auto grid gap-2.5 pt-6">
                <Link href="/submit-profile" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-bold no-underline transition-[transform,background-color] hover:-translate-y-0.5 ${featured ? 'bg-[linear-gradient(135deg,#f4d889,#c99432)] text-dark hover:text-dark' : 'bg-navy text-white hover:bg-dark hover:text-white'}`}>
                  {t('Register Now')} <FaArrowRight aria-hidden="true" className="text-[12px] rtl:-scale-x-100" />
                </Link>
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalam-o-Alaikum, I would like to know about the ${name}: ${category}`)}`} target="_blank" rel="noopener" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold no-underline transition-colors ${featured ? 'text-[#9fe0b4] hover:text-white' : 'text-[#14703a] hover:text-[#0d5c2d]'}`}>
                    <FaWhatsapp aria-hidden="true" /> {t('Ask on WhatsApp')}
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
