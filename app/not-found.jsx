import Image from 'next/image';
import Link from 'next/link';
import { getT } from '@/lib/i18n/server.js';

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="grid min-h-dvh place-items-center bg-cream p-8 text-center">
      <div>
        <Image src="/images/logo.png" alt="" width={88} height={88} className="mx-auto rounded-full" />
        <h1 className="mt-4 font-quicksand text-3xl font-bold text-navy">{t('This page could not be found')}</h1>
        <p className="mt-2 text-sm text-muted">{t('It may have moved, or the proposal may no longer be available.')}</p>
        <Link href="/" className="mt-5 inline-block font-semibold text-navy">{t('Back to Al Zaujain →')}</Link>
      </div>
    </main>
  );
}
