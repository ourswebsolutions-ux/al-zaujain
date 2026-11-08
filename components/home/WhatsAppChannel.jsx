import { FaArrowUpRightFromSquare, FaWhatsapp } from 'react-icons/fa6';
import { Reveal } from '@/components/ui/Reveal';
import { Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';
import { KEEP_LIGHT } from '@/lib/theme.js';
import { WHATSAPP_CHANNEL } from '@/lib/content.js';

export { WHATSAPP_CHANNEL };

export async function WhatsAppChannel({ compact = false }) {
  const t = await getT();
  const body = (
    <div className={`${KEEP_LIGHT} relative overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#03223f,#062b4e_55%,#0b3d33)] text-white shadow-[0_24px_60px_#03223f30] ${compact ? 'p-6' : 'p-10 max-m:p-6'}`}>
      <span aria-hidden="true" className="absolute -right-10 -top-10 size-56 rounded-full bg-whatsapp/25 blur-3xl" />
      <div className="relative flex items-center gap-6 max-m:flex-col max-m:items-start">
        <span className={`grid shrink-0 place-items-center rounded-2xl bg-whatsapp text-white shadow-[0_12px_30px_#14874455] ${compact ? 'size-14 text-3xl' : 'size-20 text-[44px] max-m:size-16 max-m:text-4xl'}`}><FaWhatsapp aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.6px] text-champagne">{t('Official channel')}</p>
          <h2 className={`font-extrabold leading-tight ${compact ? 'text-xl' : 'text-[30px] max-m:text-[22px]'}`}>{t('Join Our Official WhatsApp Channel')}</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#d7e0e8]">{t('Get the latest matrimonial proposals, announcements and advice from Al Zaujain straight on WhatsApp.')}</p>
          {!compact && <Urdu className="mt-1 text-[17px] leading-10 text-champagne">تازہ ترین رشتے سب سے پہلے واٹس ایپ پر حاصل کریں</Urdu>}
        </div>
        <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-whatsapp px-6 py-3.5 text-[13px] font-extrabold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#0f6f37] hover:text-white">
          <FaWhatsapp aria-hidden="true" className="text-lg" /> {t('Join Channel')} <FaArrowUpRightFromSquare aria-hidden="true" className="text-[10px]" />
        </a>
      </div>
    </div>
  );
  if (compact) return body;
  return (
    <section aria-label={t('Join Our Official WhatsApp Channel')} className="bg-cream px-[6%] pb-[90px] font-nunito max-b:pb-[60px]">
      <Reveal y={24} className="mx-auto max-w-[1240px]">{body}</Reveal>
    </section>
  );
}
