import { DirectorSection } from '@/components/home/DirectorSection';
import { HomeConsultants } from '@/components/home/HomeConsultants';
import { HomeSearch } from '@/components/home/HomeSearch';
import { GovRegistered } from '@/components/home/GovRegistered';
import { HeroBanner } from '@/components/home/HeroBanner';
import { ProposalShowcase } from '@/components/home/ProposalShowcase';
import { Preloader } from '@/components/layout/Preloader';
import { homeSections } from '@/lib/home-sections.js';
import { getSettings } from '@/lib/settings.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, { banners, sections, director, consultants, fees }] = await Promise.all([getSettings(), homeSections()]);

  return (
    <main>
      <Preloader />
      <HeroBanner banners={banners} search={<HomeSearch />} />
      {sections.map((section) => <ProposalShowcase key={section.id} {...section} />)}
      <DirectorSection director={director} whatsapp={settings.site_whatsapp} />
      <HomeConsultants consultants={consultants} whatsapp={settings.site_whatsapp} />
      <GovRegistered fees={fees} />
    </main>
  );
}
