import { PageHeading } from './PageHeading';
import { getT } from '@/lib/i18n/server.js';

export async function LegalPage({ title, sections }) {
  const t = await getT();
  return (
    <main>
      <PageHeading tag="AL ZAUJAIN MARRIAGE BUREAU" title={title} />
      <article className="mx-auto max-w-[800px] px-[5%] py-12">
        {sections.map(([heading, text]) => (
          <section key={heading} className="mb-7">
            <h2 className="mb-2 font-quicksand text-xl font-bold text-navy">{t(heading)}</h2>
            <p className="text-[15px] leading-[1.9] text-[#536471]">{t(text)}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
