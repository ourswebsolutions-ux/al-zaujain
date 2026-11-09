import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaComments, FaLock, FaWhatsapp } from 'react-icons/fa6';
import { BiodataHeader, CandidateSection, NameLine, PartnerSection } from '@/components/profile/Biodata';
import { LockedContact, LockedWhatsApp, PhotoLock } from '@/components/payments/UnlockProvider';
import { ChatButton } from '@/components/profile/ChatButton';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { SaveButton } from '@/components/profile/SaveButton';
import { ProposalCard } from '@/components/profile/ProposalCard';
import { ButtonLink } from '@/components/ui/Button';
import { PremiumContact } from '@/components/profile/PremiumContact';
import { TypeBadge } from '@/components/profile/TypeBadge';
import { UnlockProfile } from '@/components/profile/UnlockProfile';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTag } from '@/components/ui/Text';
import { clientIp, currentUser } from '@/lib/auth.js';
import { ageFromDob, idFromCode, profileCode } from '@/lib/format.js';
import { publicExportProps } from '@/lib/manage-view.js';
import { compatibleProfiles, similarProfiles } from '@/lib/matching.js';
import { profileView } from '@/lib/profile-view.js';
import { getProfile } from '@/lib/profiles.js';
import { getT } from '@/lib/i18n/server.js';


export async function generateMetadata({ params }) {
  const { code } = await params;
  const profile = await getProfile(idFromCode(code));
  if (!profile || profile.status !== 'approved') return { title: 'Proposal', robots: { index: false } };
  const title = `${profile.display_name}, ${ageFromDob(profile.date_of_birth)} · ${profile.city}`;
  return { title, description: `Rishta proposal ${profileCode(profile.id)}: ${profile.occupation ?? ''}, ${profile.city}, ${profile.country_name}.`, alternates: { canonical: `/profile/${profileCode(profile.id)}` } };
}

function MatchRow({ tag, title, profiles }) {
  if (profiles.length === 0) return null;
  return (
    <section className="bg-cream px-[6%] py-[60px] font-nunito text-navy">
      <SectionTag>{tag}</SectionTag>
      <h2 className="mb-8 mt-2 text-[34px] font-extrabold leading-tight max-b:text-[26px]">{title}</h2>
      <div className="grid grid-cols-4 gap-5 max-[1180px]:grid-cols-3 max-p:grid-cols-2 max-sm:grid-cols-1">
        {profiles.map((profile) => (
          <Reveal key={profile.code} y={38} scale={0.96}><ProposalCard profile={profile} matchScore={profile.score} /></Reveal>
        ))}
      </div>
    </section>
  );
}

export default async function ProfilePage({ params }) {
  const t = await getT();
  const { code } = await params;
  const profile = await getProfile(idFromCode(code));
  if (!profile) notFound();

  const user = await currentUser();
  const view = await profileView(profile, user, await clientIp());
  if (!view) notFound();
  const { label, data, locks, contact, options, photos, photoLocked, isOwner, live, canChat, canSave, yourScore, saved, whatsapp, premiumWhatsapp, credits } = view;
  const whatsappLocked = locks.whatsapp;
  const exportProps = await publicExportProps(profile, photoLocked ? null : photos[0]?.file, options, contact.rows);

  return (
    <main className="bg-cream">
      <div className="px-[6%] pt-[26px] text-sm"><Link href="/proposals" className="text-navy">{t('← Back to proposals')}</Link></div>
      {!live && <p className="mx-[6%] mt-4 rounded-lg bg-[#fcf4e1] p-3 text-xs font-semibold text-[#806126]">{t('This profile is not public yet. Only you and the Al Zaujain team can see this page.')}</p>}

      <div className="px-[6%] pb-14 pt-6 max-m:px-[4%]">
        <article className="mx-auto max-w-[1240px] overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_24px_60px_#03223f14]">
          <BiodataHeader data={data} />
          <div className="grid grid-cols-[320px_1fr] max-b:grid-cols-1">
            <aside className="border-e border-[#eee6d8] bg-paper p-7 max-b:border-b max-b:border-e-0 max-m:p-5">
              <div className="b:sticky b:top-6">
                <div className="relative mx-auto grid aspect-square max-w-[380px] place-items-center overflow-hidden rounded-[20px] bg-[#e9e1d1] ring-4 ring-white shadow-[0_10px_28px_#03223f1f]">
                  {photoLocked && <PhotoLock large type={profile.access_type} />}
                  <TypeBadge type={profile.access_type} className="absolute start-3 top-3 z-10" />
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/media/photos/${photos[0].file}`} alt={`Portrait of ${profile.display_name}`} className="size-full object-cover" />
                  ) : (
                    <div className="p-4 text-center">
                      <Image src="/images/logo.png" alt="" width={120} height={120} className="mx-auto rounded-full opacity-60" />
                      {!profile.photo_public && <p className="mt-3 text-xs font-semibold text-muted"><FaLock aria-hidden="true" className="inline-block" /> {t('Photo shared through the consultancy')}</p>}
                    </div>
                  )}
                </div>
                {photos.length > 1 && (
                  <ul className="mx-auto mt-3 grid max-w-[380px] grid-cols-4 gap-2">
                    {photos.slice(1, 5).map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <li key={photo.id}><a href={`/media/photos/${photo.file}`}><img src={`/media/photos/${photo.thumb}`} alt="" loading="lazy" className="aspect-square rounded-lg object-cover" /></a></li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 text-center">
                  <NameLine data={data} />
                  <p className="mt-1 text-[13px] text-muted">{[profile.city, profile.country_name].filter(Boolean).join(', ')}</p>
                  {yourScore !== null && <p className="mx-auto mt-2 w-fit rounded-full bg-[#fcf4e1] px-3 py-1 text-xs font-bold text-[#806126]">{yourScore}% match with your profile</p>}
                </div>
                <div className="mt-5 grid gap-2.5 [&_form]:grid [&_a]:w-full [&_button]:w-full">
                  {locks.premium ? null : whatsappLocked ? <LockedWhatsApp label="Contact Al Zaujain" /> : <ButtonLink external href={whatsapp}><FaWhatsapp aria-hidden="true" /> {t('Contact Al Zaujain')}</ButtonLink>}
                  {canChat && (user ? <ChatButton code={label} /> : <ButtonLink tone="gold" href={`/login?next=/profile/${label}`}><FaComments aria-hidden="true" /> {t('Sign in to chat')}</ButtonLink>)}
                  {canSave && <SaveButton code={label} saved={saved} variant="button" />}
                  <UnlockProfile code={label} credits={credits} signedIn={!!user} />
                </div>
              </div>
            </aside>
            <div className="min-w-0 p-9 max-m:p-5">
              <CandidateSection data={data} />
              {locks.premium ? <PremiumContact href={premiumWhatsapp} /> : <LockedContact labels={contact.locked} />}
            </div>
          </div>
          <PartnerSection data={data} />
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee6d8] px-9 py-5 max-m:px-5">
            <p className="text-xs text-muted">{t('Share this biodata with your family.')}</p>
            <ProfileActions {...exportProps} compact />
          </footer>
        </article>
      </div>

      {live && (
        <>
          <MatchRow tag="SUGGESTED FOR THIS PROFILE" title={t('Compatible proposals')} profiles={await compatibleProfiles(profile)} />
          <section className="bg-paper px-[6%] py-[60px] font-nunito text-navy">
            <SectionTag>{t('YOU MAY ALSO LIKE')}</SectionTag>
            <h2 className="mb-8 mt-2 text-[34px] font-extrabold leading-tight max-b:text-[26px]">{t('Similar proposals')}</h2>
            <div className="grid grid-cols-4 gap-5 max-[1180px]:grid-cols-3 max-p:grid-cols-2 max-sm:grid-cols-1">
              {(await similarProfiles(profile)).map((item) => <ProposalCard key={item.code} profile={item} />)}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
