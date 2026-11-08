import { PageHeading } from '@/components/listing/PageHeading';
import { ConsultantCard } from '@/components/profile/ConsultantCard';
import { Reveal } from '@/components/ui/Reveal';
import { publicConsultants } from '@/lib/consultants.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marriage consultants', description: 'Meet the Al Zaujain marriage consultants who guide families through every step of finding a rishta.' };

export default async function ConsultantsPage() {
  const t = await getT();
  const consultants = await publicConsultants();
  return (
    <main>
      <PageHeading tag="A REAL CONVERSATION" title={t('Professional marriage consultants')} urdu="ہمارے مشیر" text={t('Work with an experienced consultant, in Pakistan or overseas, who will understand your family and guide every step.')} />
      <section className="px-[6%] py-12">
        {consultants.length > 0 ? (
          <div className="grid grid-cols-4 gap-5 max-p:grid-cols-2 max-g:grid-cols-1">
            {consultants.map((consultant) => <Reveal key={consultant.id} y={30} scale={0.96}><ConsultantCard consultant={consultant} /></Reveal>)}
          </div>
        ) : <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">{t('Our consultants will be listed here soon.')}</p>}
      </section>
    </main>
  );
}
