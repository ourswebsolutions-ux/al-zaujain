import Image from 'next/image';
import { getT } from '@/lib/i18n/server.js';

// CSS-only: it fades itself out, so it can never trap a visitor if JavaScript fails.
export async function Preloader() {
  const t = await getT();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1100] flex animate-preloader flex-col items-center justify-center gap-4 bg-paper font-nunito text-navy motion-reduce:hidden">
      <Image src="/images/logo.png" alt="" width={88} height={88} priority className="size-[88px] rounded-full" />
      <strong className="text-[22px] font-bold leading-[33px] tracking-[3px]">AL ZAUJAIN</strong>
      <span className="text-xs leading-[18px]">{t('Building relationships, building futures.')}</span>
      <div className="h-0.5 w-[140px] bg-gold" />
    </div>
  );
}
