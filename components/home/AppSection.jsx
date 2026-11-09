import Image from 'next/image';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { FaAndroid, FaArrowUpRightFromSquare, FaComments, FaDownload, FaHeart, FaUser } from 'react-icons/fa6';
import { Reveal } from '@/components/ui/Reveal';
import { headingNunito, Urdu } from '@/components/ui/Text';
import { appRelease, megabytes } from '@/lib/app-release.js';
import { getT } from '@/lib/i18n/server.js';
import { siteUrl } from '@/lib/mail.js';

const FEATURES = [[FaUser, 'Your profile'], [FaHeart, 'Your preferences'], [FaComments, 'Stay connected']];

// The address this page was opened on, so the QR code and the app's setup always point here.
async function origin() {
  const list = await headers();
  const host = list.get('x-forwarded-host') || list.get('host');
  if (!host) return siteUrl();
  const proto = list.get('x-forwarded-proto')?.split(',')[0] || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

const qrSvg = (url) => QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#062b4e', light: '#ffffff' } });

export async function AppSection({ whatsapp }) {
  const t = await getT();
  const release = appRelease();
  const site = await origin();
  const downloadUrl = release ? `${site}${release.url}` : null;
  return (
    <section id="android-app" className="mx-[6%] mb-[70px] mt-5 grid scroll-mt-[15px] grid-cols-[1.15fr_.85fr] items-center gap-[6%] rounded-[30px] border border-line bg-cream p-[45px] font-nunito text-navy max-t:grid-cols-1 max-t:gap-[35px] max-t:p-[30px] max-[500px]:mx-[4%] max-[500px]:mb-[50px] max-[500px]:mt-2.5 max-[500px]:p-[25px]">
      <Reveal duration={0.9}>
        <span className="inline-flex items-center gap-2.5 text-xs font-extrabold leading-[18px] tracking-[1px] text-[#806126]">
          <FaAndroid aria-hidden="true" className="text-[23px]" /> {t(release ? 'ANDROID APP · NOW AVAILABLE' : 'ANDROID APP · COMING SOON')}
        </span>
        <h2 className={headingNunito}>{t('Your next chapter.')}<br />{t('A little closer.')}</h2>
        <Urdu className="mb-4 text-2xl leading-[60px] text-[#9b712b] max-m:text-xl max-m:leading-[50px]">رشتوں کا نیا سفر، اب آپ کے موبائل پر</Urdu>
        <p className="mb-4 text-base leading-[28.8px]">
          {t(release
            ? 'Browse proposals, manage your profile, receive your matches and chat, all from your phone. The app uses the same account as this website.'
            : 'We’re planning a simpler way to stay connected with Al Zaujain. A thoughtful mobile experience for you and your family.')}
        </p>
        <div aria-label={t(release ? 'App features' : 'Planned app features')} className="my-6 flex gap-3 max-m:gap-[18px]">
          {FEATURES.map(([Icon, text]) => (
            <span key={text} className="flex-1 text-[13px] font-bold leading-[19.5px]">
              <Icon aria-hidden="true" className="mb-3 block text-[21px] text-[#aa7b28]" /> {t(text)}
            </span>
          ))}
        </div>
        {release ? (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-[22px]">
              <a href={release.url} download className="flex items-center gap-3.5 rounded-xl bg-navy px-[22px] py-3 text-start text-white no-underline transition hover:-translate-y-0.5 hover:bg-dark hover:text-white">
                <FaAndroid aria-hidden="true" className="text-[30px]" />
                <span className="text-xs leading-[16.8px]">{t('Download for')}<strong className="block text-[23px] font-bold leading-[32.2px]">{t('Android')}</strong></span>
                <FaDownload aria-hidden="true" className="ms-1 text-lg text-gold-soft" />
              </a>
              <figure className="flex items-center gap-3">
                <span className="block size-[104px] overflow-hidden rounded-xl border border-line bg-white p-1.5 [&_svg]:size-full" role="img" aria-label={t('QR code to download the Android app')} dangerouslySetInnerHTML={{ __html: await qrSvg(downloadUrl) }} />
                <figcaption className="max-w-[120px] text-[11px] font-bold leading-[16px]">{t('Scan with your phone camera to download')}</figcaption>
              </figure>
            </div>
            <p className="mt-[18px] text-[11px] leading-[19.8px] opacity-75">
              {t('Version {version} · {size}', { version: release.version, size: megabytes(release.size) })}
              {release.minAndroid ? ` · ${t('Android {version} or newer', { version: release.minAndroid })}` : ''}
            </p>
            <ol className="mt-4 grid gap-2 text-[13px] leading-[21px]">
              {[
                t('Download the app on your Android phone.'),
                t('Open the downloaded file. If Android asks, allow installing apps from your browser, then tap Install.'),
                release.builtInSite ? t('Open Al Zaujain and sign in with the same account you use on this website.') : t('Open Al Zaujain and enter this website’s address: {site}', { site }),
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <b className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eadbb8] text-[10px] font-medium text-[#7c5919]">0{index + 1}</b>
                  <span className="min-w-0 break-words">{step}</span>
                </li>
              ))}
            </ol>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="mt-5 inline-block text-sm font-extrabold leading-[21px] text-navy no-underline">
              {t('Need help installing? Ask us')} <FaArrowUpRightFromSquare aria-hidden="true" className="inline-block" />
            </a>
          </>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-[22px]">
              <span className="flex items-center gap-3.5 rounded-xl bg-navy px-[22px] py-3 text-start text-white">
                <FaAndroid aria-hidden="true" className="text-[30px]" />
                <span className="text-xs leading-[16.8px]">{t('Coming soon for')}<strong className="block text-[23px] font-bold leading-[32.2px]">{t('Android')}</strong></span>
              </span>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="text-sm font-extrabold leading-[21px] text-navy no-underline">
                {t('Ask about the app')} <FaArrowUpRightFromSquare aria-hidden="true" className="inline-block" />
              </a>
            </div>
            <p className="mb-4 mt-[18px] text-[11px] leading-[19.8px] opacity-75">{t('The Android app is coming soon.')}</p>
          </>
        )}
      </Reveal>
      <Reveal as="figure" y={26} scale={0.98} duration={0.95} className="relative">
        <Image src="/images/android-app-concept.png" alt={t('Al Zaujain Android app phone mockups')} width={1254} height={1254} sizes="(max-width: 900px) 90vw, 35vw" className="h-auto w-full rounded-[200px_200px_18px_18px]" />
      </Reveal>
    </section>
  );
}
