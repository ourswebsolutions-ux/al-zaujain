import Link from 'next/link';
import { PageHeading } from '@/components/listing/PageHeading';
import { ConsultantCard } from '@/components/profile/ConsultantCard';
import { Reveal } from '@/components/ui/Reveal';
import { currentUser } from '@/lib/auth.js';
import { consultantCities, publicConsultants } from '@/lib/consultants.js';
import { memberProfiles, primaryProfile } from '@/lib/dashboard.js';
import { getT } from '@/lib/i18n/server.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marriage consultants', description: 'Meet the Al Zaujain marriage consultants who guide families through every step of finding a rishta.' };

const chip = 'rounded-full border px-3.5 py-1.5 text-xs font-semibold no-underline transition-colors';

export default async function ConsultantsPage({ searchParams }) {
  const t = await getT();
  const cities = await consultantCities();
  const asked = (await searchParams).city;
  // A member sees their own city's consultants without choosing; anyone can choose a city.
  const user = await currentUser();
  const ownCity = user?.role === 'user' ? primaryProfile(await memberProfiles(user.id))?.city ?? null : null;
  // No choice yet: a member sees their own city. "all" shows only the consultants for everyone.
  const city = cities.includes(asked) ? asked : (asked === undefined && cities.includes(ownCity) ? ownCity : null);
  const consultants = await publicConsultants({ city });
  return (
    <main>
      <PageHeading tag="A REAL CONVERSATION" title={t('Professional marriage consultants')} urdu="ہمارے مشیر" text={t('Work with an experienced consultant, in Pakistan or overseas, who will understand your family and guide every step.')} />
      {cities.length > 0 && (
        <nav aria-label={t('Consultants by city')} className="flex flex-wrap items-center gap-2 px-[6%] pt-8">
          <span className="me-1 text-xs font-semibold text-muted">{t('Your city')}:</span>
          <Link href="/consultants?city=all" aria-current={!city ? 'page' : undefined} className={`${chip} ${!city ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-gold'}`}>{t('All cities')}</Link>
          {cities.map((name) => (
            <Link key={name} href={`/consultants?city=${encodeURIComponent(name)}`} aria-current={city === name ? 'page' : undefined} className={`${chip} ${city === name ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-gold'}`}>{t(name)}</Link>
          ))}
        </nav>
      )}
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
