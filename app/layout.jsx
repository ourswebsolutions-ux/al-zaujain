import { Cormorant_Garamond, Jost, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Nunito, Poppins, Quicksand } from 'next/font/google';
import { Providers } from '@/components/ui/Providers';
import { currentUser } from '@/lib/auth.js';
import { getLang } from '@/lib/i18n/server.js';
import { getRestrictions, viewerIsPaid } from '@/lib/restrictions.js';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-poppins', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito-src', display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-quicksand-src', display: 'swap' });
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-jost', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const naskh = Noto_Naskh_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'], variable: '--font-naskh', display: 'swap' });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ['arabic'], weight: ['400', '500', '600', '700'], variable: '--font-nastaliq', display: 'swap' });

const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Al Zaujain | International Marriage Consultancy', template: '%s | Al Zaujain International Marriage Consultancy' },
  description: 'Al Zaujain is an international marriage consultancy offering trusted matrimonial services, with verified proposals from Pakistan, the UK, Europe, the USA and the Gulf.',
  openGraph: { siteName: 'Al Zaujain International Marriage Consultancy', type: 'website', images: ['/images/logo.png'] },
  icons: { icon: '/images/icon.png', apple: '/images/icon.png' },
};

const FONT_SETS = {
  en: '[--ui-font:var(--font-poppins)] [--ui-nunito:var(--font-nunito-src)] [--ui-quicksand:var(--font-quicksand-src)] [--display-font:var(--font-cormorant)] [--dash-font:var(--font-jost)]',
  // The layout never changes in Urdu. plaintext lets each text block order itself, but never touches containers,
  // and tracking is cleared because letter spacing breaks joined Urdu letters.
  ur: 'lang-ur [--ui-font:var(--font-naskh)] [--ui-nunito:var(--font-naskh)] [--ui-quicksand:var(--font-naskh)] [--display-font:var(--font-nastaliq)] [--dash-font:var(--font-naskh)] [&_:is(p,h1,h2,h3,h4,h5,h6,dt,dd,td,th,small,strong)]:[unicode-bidi:plaintext] **:tracking-normal! [&_body]:text-left',
};

export default async function RootLayout({ children }) {
  const lang = await getLang();
  const user = await currentUser();
  const [restrictions, paid] = await Promise.all([getRestrictions(), viewerIsPaid(user)]);
  return (
    <html lang={lang} className={`scroll-smooth ${poppins.variable} ${nunito.variable} ${quicksand.variable} ${jost.variable} ${cormorant.variable} ${naskh.variable} ${nastaliq.variable} ${FONT_SETS[lang]}`}>
      <body id="top" className="bg-paper font-sans leading-6 text-ink antialiased [&_svg]:w-auto">
        <Providers lang={lang} photoLocked={restrictions.photo && !paid} signedIn={!!user}>{children}</Providers>
      </body>
    </html>
  );
}
