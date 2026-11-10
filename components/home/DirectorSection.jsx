import Image from 'next/image';
import { FaAddressCard } from 'react-icons/fa6';
import { container, GlowButton, Label, Ornament, sectionX } from './HomeUi';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';

// The director of Al Zaujain, as the administrator writes it under Homepage. A framed portrait with a
// soft offset panel behind it, and the name, a one-line summary, the story and a contact button.
export async function DirectorSection({ director, whatsapp }) {
  const t = await getT();
  const href = director.href || (whatsapp ? `https://wa.me/${whatsapp}` : '/consultants');
  const external = /^(https?:|tel:|mailto:)/i.test(href);
  return (
    <section id="why-choose" className={`scroll-mt-[90px] overflow-x-clip border-y border-[#eee] bg-[#fcf9f6] py-[60px] font-sans text-navy max-sm:py-11 ${sectionX}`}>
      <div className={container}>
        <Reveal y={16} className="mb-10 text-center max-sm:mb-7">
          <Label>{t(director.title)}</Label>
          <Ornament className="mt-3" />
        </Reveal>
        <div className="grid grid-cols-[minmax(0,525px)_minmax(0,1fr)] items-center gap-12 max-b:grid-cols-1 max-b:gap-10">
          <Reveal x={-20} className="relative mx-auto w-full max-w-[525px] pb-6 pe-6 max-sm:pb-4 max-sm:pe-4">
            <span aria-hidden="true" className="absolute inset-0 start-6 top-6 rounded-[20px] bg-[#efe3cf] max-sm:start-4 max-sm:top-4" />
            <div className="relative aspect-square overflow-hidden rounded-[18px] border-[6px] border-[#f3e9d6] bg-[radial-gradient(circle_at_50%_35%,#ffffff,#efe4cf)] shadow-[0_12px_30px_#062b4e1f]">
              {director.photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={director.photoSrc} alt={director.name} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
              ) : (
                <Image src="/images/logo.png" alt={t('Al Zaujain logo')} fill sizes="(max-width: 992px) 90vw, 525px" className="object-contain p-[12%]" />
              )}
            </div>
          </Reveal>
          <Reveal x={20}>
            <h2 className="mb-5 text-[44px] font-bold leading-tight text-navy max-p:text-[38px] max-sm:text-[30px]">{director.name}</h2>
            {director.summary && <p className="mb-6 text-[17px] leading-[1.6] text-[#2f3b4a] max-sm:text-[15px]">{t(director.summary)}</p>}
            {director.bio.split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mb-5 text-[17px] leading-[1.65] text-[#2f3b4a] max-sm:text-[15px]">{t(paragraph)}</p>
            ))}
            {director.cta && (
              <GlowButton href={href} external={external} className="mt-1"><FaAddressCard aria-hidden="true" className="text-gold" /> <span>{t(director.cta)}</span></GlowButton>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
