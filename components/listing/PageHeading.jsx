import { SectionTag, Urdu } from '@/components/ui/Text';
import { getT } from '@/lib/i18n/server.js';

export async function PageHeading({ tag, title, urdu, text }) {
  const t = await getT();
  return (
    <header className="bg-cream px-[6%] pb-10 pt-[60px] font-nunito text-navy max-m:pb-7 max-m:pt-10">
      <SectionTag>{t(tag)}</SectionTag>
      <div className="flex items-center justify-between gap-6">
        <h1 className="my-2 text-[46px] font-extrabold leading-[55.2px] max-b:text-[30px] max-b:leading-9">{t(title)}</h1>
        {urdu && <Urdu className="text-2xl leading-[60px] text-[#9b712b] max-m:text-lg">{urdu}</Urdu>}
      </div>
      {text && <p className="text-base leading-[28.8px]">{t(text)}</p>}
    </header>
  );
}
