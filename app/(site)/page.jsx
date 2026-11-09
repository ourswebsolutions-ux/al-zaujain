import { AppSection } from '@/components/home/AppSection';
import { Contact } from '@/components/home/Contact';
import { Faq } from '@/components/home/Faq';
import { AdvancedSearch } from '@/components/home/AdvancedSearch';
import { Featured } from '@/components/home/Featured';
import { WhatsAppChannel } from '@/components/home/WhatsAppChannel';
import { Hero } from '@/components/home/Hero';
import { Journey } from '@/components/home/Journey';
import { Reasons } from '@/components/home/Reasons';
import { Registration } from '@/components/home/Registration';
import { Preloader } from '@/components/layout/Preloader';
import { activeFaqs } from '@/lib/content.js';
import { activeCountries, casteOptions, citiesWithCountry, featuredCities, nationalityOptions } from '@/lib/places.js';
import { carouselProfiles } from '@/lib/profiles.js';
import { getSettings } from '@/lib/settings.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSettings();
  return (
    <main>
      <Preloader />
      <Hero settings={settings} cities={await featuredCities()} />
      <AdvancedSearch countries={await activeCountries()} cities={await citiesWithCountry()} castes={await casteOptions()} nationalities={await nationalityOptions()} />
      <Journey />
      <Featured profiles={await carouselProfiles(8)} />
      <WhatsAppChannel />
      <Reasons />
      <Registration settings={settings} />
      <AppSection whatsapp={settings.site_whatsapp} />
      <Faq faqs={await activeFaqs()} whatsapp={settings.site_whatsapp} />
      <Contact settings={settings} />
    </main>
  );
}
