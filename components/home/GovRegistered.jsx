import Image from 'next/image';
import { FaCircleCheck, FaFileLines } from 'react-icons/fa6';
import { container, GlowButton, Label, sectionX } from './HomeUi';
import { GradientHeading, Ornament } from './HomeUi';
import { Reveal } from '@/components/ui/Reveal';
import { getT } from '@/lib/i18n/server.js';

export async function GovRegistered({ fees }) {
  const t = await getT();
  const ntn = (fees.ntn.match(/[\d-]{6,}/) ?? [])[0];
  const tiles = [
    { key: 'gov', mark: <Image src="/images/pakistan-emblem.svg" alt="" width={90} height={100} className="h-[100px] w-auto object-contain max-sm:h-[76px]" />, title: 'Government Registered', text: 'Registered matrimonial service, Government of Pakistan' },
    { key: 'fbr', mark: <Image src="/images/fbr-logo.png" alt="FBR Pakistan" width={190} height={101} className="h-[92px] w-auto object-contain max-sm:h-[70px]" />, title: 'FBR Registered', text: ntn ? t('NTN {ntn}', { ntn }) : '' },
  ];
  return (
    <section id="registration" className={`scroll-mt-[90px] overflow-x-clip bg-[#fbf6ee] py-[60px] font-sans text-navy max-sm:py-11 ${sectionX}`}>
      <div className={container}>
        <Reveal y={20} className="mb-3 text-center">
          <Label className="mb-3">{t('Welcome to {company}', { company: 'Al Zaujain Marriage Bureau' })}</Label>
          <GradientHeading as="h2" className="mb-4 text-[40px] leading-[1.2] max-p:text-[34px] max-sm:text-[26px]">{t('Government Registered Marriage Bureau')}</GradientHeading>
          <Ornament className="mb-3 mt-2" />
          <p className="text-[22px] font-semibold text-[#a17a33] max-sm:text-base">{t('Government Registered · FBR Registered')}</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 items-center gap-12 max-b:grid-cols-1 max-b:gap-9 max-sm:mt-8">
          <Reveal x={-20}>
            <p className="mb-4 text-[17px] leading-[1.65] text-[#2f3b4a] max-sm:text-[15px]">
              {t('{company} is a registered matrimonial service based in {city}, serving Pakistani families at home and overseas.', { company: 'Al Zaujain Marriage Bureau', city: t('Multan, Pakistan') })}
            </p>
            <p className="mb-4 text-[17px] leading-[1.65] text-[#2f3b4a] max-sm:text-[15px]">
              {t('We work with honesty, privacy and care, and we guide every family as we would our own. Our business is registered with the Government of Pakistan and FBR.')}
            </p>
            <ul className="mb-7 grid gap-2.5">
              {[t('Government Registered'), ntn ? t('FBR Registered · NTN {ntn}', { ntn }) : t('FBR Registered')].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[15.5px] font-semibold text-navy max-sm:text-[14.5px]"><FaCircleCheck aria-hidden="true" className="shrink-0 text-[#1f8a3a]" /> {item}</li>
              ))}
            </ul>
            <GlowButton href="/packages#personalizedMatching"><FaFileLines aria-hidden="true" className="text-gold" /> <span>{t('View Registration Details')}</span></GlowButton>
          </Reveal>

          <Reveal x={20} className="rounded-[20px] bg-white p-6 shadow-[0_15px_40px_#062b4e14] max-sm:p-4">
            <div className="grid grid-cols-2 border border-[#efe6d5] max-[420px]:grid-cols-1">
              {tiles.map((tile) => (
                <div key={tile.key} className="flex flex-col items-center justify-center gap-3 border-[#efe6d5] bg-white px-4 py-9 text-center first:border-e max-[420px]:first:border-b max-[420px]:first:border-e-0 max-sm:py-7">
                  {tile.mark}
                  <div>
                    <p className="text-[17px] font-bold text-navy max-sm:text-[15.5px]">{t(tile.title)}</p>
                    {tile.text && <p className="mt-1 text-[13px] leading-5 text-muted">{t(tile.text)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
