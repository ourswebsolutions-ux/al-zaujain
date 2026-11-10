import { Assistant } from '@/components/layout/Assistant';
import { ChannelWelcome } from '@/components/layout/ChannelWelcome';
import { FloatingActions } from '@/components/layout/FloatingActions';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { currentUser } from '@/lib/auth.js';
import { WHATSAPP_CHANNEL } from '@/lib/content.js';
import { unreadCount } from '@/lib/chat.js';
import { activeCategories } from '@/lib/places.js';
import { getT } from '@/lib/i18n/server.js';
import { getSettings } from '@/lib/settings.js';

export default async function SiteLayout({ children }) {
  const settings = await getSettings();
  const user = await currentUser();
  const t = await getT();
  const categories = await activeCategories();
  return (
    <>
      <a href="#main" className="fixed -top-24 start-[15px] z-[100] bg-white p-3 focus:top-[15px]">{t('Skip to content')}</a>
      <Header phone={settings.site_phone} phoneIntl={settings.site_phone_intl} user={user} unread={user ? await unreadCount(user.id) : 0} categories={categories} announcements={(settings.announcements ?? '').split('\n').map((line) => line.trim()).filter(Boolean)} />
      <div id="main">{children}</div>
      <Footer settings={settings} />
      <Assistant phone={settings.site_phone} whatsapp={settings.site_whatsapp} location={settings.site_location} />
      <FloatingActions whatsapp={settings.site_whatsapp} />
      <ChannelWelcome url={WHATSAPP_CHANNEL} />
    </>
  );
}
