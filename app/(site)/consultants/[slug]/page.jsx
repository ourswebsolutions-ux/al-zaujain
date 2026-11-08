import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa6';
import { ConsultantPhoto } from '@/components/profile/ConsultantCard';
import { ButtonLink } from '@/components/ui/Button';
import { consultantBySlug } from '@/lib/consultants.js';
import { getT } from '@/lib/i18n/server.js';

export async function generateMetadata({ params }) {
  const consultant = await consultantBySlug((await params).slug);
  return { title: consultant ? `${consultant.display_name}, marriage consultant` : 'Consultant', description: consultant?.bio?.slice(0, 150) };
}

export default async function ConsultantPage({ params }) {
  const t = await getT();
  const consultant = await consultantBySlug((await params).slug);
  if (!consultant) notFound();
  return (
    <main>
      <div className="px-[7%] pt-[26px] text-sm"><Link href="/consultants" className="text-navy">{t('← Back to consultants')}</Link></div>
      <div className="grid grid-cols-[minmax(240px,380px)_1fr] gap-[60px] px-[7%] py-[65px] max-[700px]:grid-cols-1 max-[700px]:gap-7 max-[700px]:px-[6%] max-[700px]:py-[30px]">
        <aside><ConsultantPhoto consultant={consultant} className="aspect-square w-full rounded-[22px]" /></aside>
        <article className="rounded-[20px] border border-line bg-white p-[35px] max-[700px]:p-6">
          <h1 className="text-4xl font-medium text-navy">{consultant.display_name}</h1>
          <p className="mt-2 text-[15px] leading-[1.9] text-[#9b712b]">{t(consultant.title)}</p>
          {consultant.bio && <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.9] text-[#536471]">{consultant.bio}</p>}
          <dl className="mt-6 grid grid-cols-2 gap-4 max-m:grid-cols-1">
            {[['City', consultant.city], ['Languages', consultant.languages], ['Experience', consultant.experience_years ? t('{count} years', { count: consultant.experience_years }) : null]].filter(([, value]) => value).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[.7px] text-muted">{t(label)}</dt>
                <dd className="text-sm font-medium text-navy">{t(value)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            {consultant.whatsapp && <ButtonLink external href={`https://wa.me/${consultant.whatsapp}`}><FaWhatsapp aria-hidden="true" /> {t('WhatsApp')}</ButtonLink>}
            {consultant.phone && <ButtonLink tone="gold" external href={`tel:${consultant.phone.replace(/\s/g, '')}`}><FaPhone aria-hidden="true" /> {consultant.phone}</ButtonLink>}
            {consultant.public_email && <ButtonLink tone="outline" external href={`mailto:${consultant.public_email}`}><FaEnvelope aria-hidden="true" /> {t('Email')}</ButtonLink>}
          </div>
        </article>
      </div>
    </main>
  );
}
