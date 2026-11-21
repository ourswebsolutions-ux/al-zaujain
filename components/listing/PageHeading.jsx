import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

export async function PageHeading({ tag, title, urdu, text }) {
  const t = await getT();
  return (
    <header className="bg-cream px-[6%] pb-10 pt-[60px] font-nunito text-navy max-m:pb-7 max-m:pt-10">
      <SectionTag>{t(tag)}</SectionTag>
      {/* The Urdu line sits beside the title on wide screens and drops under it, on one line, on phones. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-0">
        <h1 className="my-2 text-[46px] font-extrabold leading-[55.2px] max-b:text-[30px] max-b:leading-9">{t(title)}</h1>
        {urdu && <Urdu heading className="whitespace-nowrap text-[28px] leading-[2] text-[#9b712b] max-m:w-full max-m:text-start max-m:text-[22px] rtl:max-m:text-end">{urdu}</Urdu>}
      </div>
      {text && <p className="text-base leading-[28.8px]">{t(text)}</p>}
    </header>
  );
}
