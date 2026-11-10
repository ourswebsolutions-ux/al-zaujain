import Link from 'next/link';
import { GradientHeading, Label, Ornament } from '@/components/home/HomeUi';
import { ConsultantTile } from '@/components/profile/ConsultantTile';
import { Reveal } from '@/components/ui/Reveal';
import { currentUser } from '@/lib/auth.js';
import { consultantCities, publicConsultants } from '@/lib/consultants.js';
import { memberProfiles, primaryProfile } from '@/lib/dashboard.js';
import { getT } from '@/lib/i18n/server.js';
import { getSettings } from '@/lib/settings.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marriage consultants', description: 'Meet the Al Zaujain marriage consultants who guide families through every step of finding a rishta.' };

const chip = 'rounded-full border px-4 py-2 text-[13px] font-semibold capitalize no-underline transition-colors';

// All consultants, with the same cards as the homepage. Families can choose their city to also see
// that city's own consultants (a member sees their own city's without choosing).
export default async function ConsultantsPage({ searchParams }) {
  const t = await getT();
  const [cities, settings] = await Promise.all([consultantCities(), getSettings()]);
  const asked = (await searchParams).city;
  const user = await currentUser();
  const ownCity = user?.role === 'user' ? primaryProfile(await memberProfiles(user.id))?.city ?? null : null;
  // No choice yet: a member sees their own city. "all" shows only the consultants for everyone.
  const city = cities.includes(asked) ? asked : (asked === undefined && cities.includes(ownCity) ? ownCity : null);
  const consultants = await publicConsultants({ city });
  const now = new Date();
  return (
    <main className="bg-[#f8f1e6] px-[5%] pb-20 pt-14 font-sans text-navy max-sm:px-4 max-sm:pb-14 max-sm:pt-10">
      <div className="mx-auto w-full max-w-[1310px]">
        <Reveal y={20} className="mb-10 text-center max-sm:mb-8">
          <Label className="mb-3">{t('Expert Team')}</Label>
          <GradientHeading as="h1" className="text-[42px] leading-[1.2] max-p:text-[34px] max-sm:text-[27px]">{t('Hire Personal Matchmaking Consultant')}</GradientHeading>
          <Ornament className="mb-5 mt-5" />
          <p className="mx-auto max-w-[840px] text-[17px] leading-[1.6] text-[#3d4a5a] max-sm:text-[15px]">
            {t('Our consultants work with you personally: they understand your family’s requirements, suggest suitable proposals and stay with you until the rishta is settled.')}
          </p>
        </Reveal>

        {cities.length > 0 && (
          <nav aria-label={t('Consultants by city')} className="mb-10 flex flex-wrap items-center justify-center gap-2.5 max-sm:mb-8">
            <span className="me-1 text-[13px] font-semibold text-muted">{t('Your city')}:</span>
            <Link href="/consultants?city=all" aria-current={!city ? 'page' : undefined} className={`${chip} ${!city ? 'border-navy bg-navy text-white' : 'border-[#e9cfa0] bg-white text-navy hover:border-gold'}`}>{t('All cities')}</Link>
            {cities.map((name) => (
              <Link key={name} href={`/consultants?city=${encodeURIComponent(name)}`} aria-current={city === name ? 'page' : undefined} className={`${chip} ${city === name ? 'border-navy bg-navy text-white' : 'border-[#e9cfa0] bg-white text-navy hover:border-gold'}`}>{t(name)}</Link>
            ))}
          </nav>
        )}

        {consultants.length > 0 ? (
          <ul className="grid grid-cols-4 gap-6 max-[1180px]:grid-cols-3 max-t:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5">
            {consultants.map((consultant, index) => (
              <Reveal as="li" key={consultant.id} y={24} delay={Math.min(index % 4, 3) * 0.06} className="min-w-0">
                <ConsultantTile consultant={consultant} whatsapp={settings.site_whatsapp} t={t} now={now} />
              </Reveal>
            ))}
          </ul>
        ) : <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">{t('Our consultants will be listed here soon.')}</p>}
      </div>
    </main>
  );
}
