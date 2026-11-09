import { WhatsAppChannel } from '@/components/home/WhatsAppChannel';
import { KEEP_LIGHT } from '@/lib/theme.js';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FaArrowRight, FaCircleCheck, FaCircleExclamation, FaClock, FaComments, FaEye, FaHeart, FaHeartCircleCheck, FaIdCard, FaPenToSquare, FaSliders, FaUserTie } from 'react-icons/fa6';
import { CompletionRing } from '@/components/member/CompletionRing';
import { MatchCard } from '@/components/member/MatchCard';
import { Card, EmptyState, StatTile } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { Urdu } from '@/components/ui/Text';
import { requireUser } from '@/lib/auth.js';
import { memberOverview } from '@/lib/dashboard.js';
import { firstName, profileCode } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';

const VERIFICATION = {
  verified: { icon: FaCircleCheck, color: 'text-verified', title: 'Verified', text: 'Your profile shows the blue tick.' },
  pending: { icon: FaClock, color: 'text-[var(--d-gold,#a67b2e)]', title: 'Verification pending', text: 'Our team is reviewing your CNIC privately.' },
  rejected: { icon: FaCircleExclamation, color: 'text-[var(--d-red,#a33a2c)]', title: 'Verification needs attention', text: 'Please upload a clearer copy of your CNIC.' },
  not_submitted: { icon: FaIdCard, color: 'text-muted', title: 'Not verified yet', text: 'Upload your CNIC to earn the blue tick.' },
};

const REVIEW = { approved: 'Your profile is live.', pending: 'Your profile is under review.', rejected: 'Your profile needs attention.' };

const SHORTCUTS = [
  { href: '/dashboard/edit', label: 'Edit profile', icon: FaPenToSquare },
  { href: '/dashboard/preferences', label: 'Partner preferences', icon: FaSliders },
  { href: '/dashboard/profile', label: 'Download biodata', icon: FaIdCard },
  { href: '/proposals', label: 'Browse proposals', icon: FaHeartCircleCheck },
];

async function Hero({ user, primary, welcome }) {
  const t = await getT();
  const completion = primary?.completion;
  return (
    <section className={`${KEEP_LIGHT} relative overflow-hidden rounded-[20px] bg-navy px-8 py-7 text-white shadow-[0_18px_44px_#03223f33] max-m:px-5`}>
      <div className="absolute -end-16 -top-24 size-72 rounded-full border border-gold-soft/15" aria-hidden="true" />
      <div className="absolute -end-4 -top-36 size-72 rounded-full border border-gold-soft/10" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 max-w-[620px]">
          <Urdu className="text-start text-[15px] leading-9 text-champagne">السلام علیکم</Urdu>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.5px] max-m:text-[23px]">{t(welcome ? 'Welcome, {name}' : 'Welcome back, {name}', { name: firstName(user.name) })}</h1>
          <p className="mt-2 text-[13px] leading-[22px] text-[#c7d3dd]">
            {t(welcome ? 'Your account is ready. Create your matrimonial biodata to start receiving proposals.' : primary ? REVIEW[primary.status] : 'Create your matrimonial biodata to start receiving proposals.')}
          </p>
          <div className="mt-4">
            {!primary ? <ButtonLink tone="gold" href="/dashboard/edit">{t('Create my biodata')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></ButtonLink>
              : completion.percent < 100 && <ButtonLink tone="gold" size="md" href={`/dashboard/${completion.missing[0].href}`}>{t('Complete my profile')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></ButtonLink>}
          </div>
        </div>
        {completion && (
          <div className="flex items-center gap-4">
            <CompletionRing percent={completion.percent} />
            <p className="text-xs leading-5 text-[#c7d3dd]">{t('Profile completion')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }) {
  const user = await requireUser();
  if (user.role === 'admin') redirect('/admin');
  if (user.role === 'consultant') redirect('/consultant');
  const { welcome } = await searchParams;
  const t = await getT();
  const { primary, profiles, views, matches, matchCount, saved, unread } = await memberOverview(user);
  const verification = VERIFICATION[primary?.verification_status ?? 'not_submitted'];

  return (
    <div className="grid gap-6">
      <Hero user={user} primary={primary} welcome={welcome === '1'} />
      <WhatsAppChannel compact />

      <div className="grid grid-cols-4 gap-4 max-p:grid-cols-2">
        <StatTile icon={<FaEye aria-hidden="true" />} label="Profile views" value={views.total} note={t('{count} in the last 7 days', { count: views.lastWeek })} href="/dashboard/views" />
        <StatTile icon={<FaHeartCircleCheck aria-hidden="true" />} label="Matching proposals" value={matchCount} note={t(profiles.length ? 'Ranked for your profile' : 'After your profile is live')} href="/dashboard/matches" />
        <StatTile icon={<FaHeart aria-hidden="true" />} label="Saved profiles" value={saved.size} note={t('Your shortlist')} href="/dashboard/saved" />
        <StatTile icon={<FaComments aria-hidden="true" />} label="Unread messages" value={unread} note={t('In your inbox')} href="/messages" />
      </div>

      {!primary && (
        <Card title="Getting started is simple">
          <ol className="grid grid-cols-3 gap-4 max-m:grid-cols-1">
            {[['1', 'Create your biodata', 'Fill in the form, one step at a time.'], ['2', 'We review it', 'Our team checks every profile before it goes live.'], ['3', 'Receive proposals', 'Suitable matches appear here for you.']].map(([number, title, text]) => (
              <li key={number} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#062b4e] text-sm font-semibold text-champagne">{number}</span>
                <span><strong className="block text-[13px] text-navy">{t(title)}</strong><span className="text-xs leading-5 text-muted">{t(text)}</span></span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 max-[1180px]:grid-cols-1">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-navy">{t('Recommended matches')}</h2>
              {matches.length > 0 && <Link href="/dashboard/matches" className="text-xs font-semibold text-[var(--d-gold,#9b712b)] no-underline">{t('View all')}</Link>}
            </div>
            {matches.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 max-m:grid-cols-1">
                {matches.map((card) => <MatchCard key={card.code} card={card} saved={saved.has(card.code)} />)}
              </div>
            ) : <EmptyState icon={<FaHeartCircleCheck aria-hidden="true" />} title="Your matches will appear here" text="Once your profile is approved, we will rank suitable proposals for you." />}
          </section>
          <Card title="Shortcuts">
            <div className="grid grid-cols-4 gap-3 max-m:grid-cols-2">
              {SHORTCUTS.map((item) => (
                <Link key={item.href} href={item.href} className="group flex flex-col gap-2 rounded-xl border border-[var(--d-line,#eef0f3)] p-4 text-xs font-medium text-navy no-underline transition-colors hover:border-[var(--d-line,#dcc9a0)] hover:bg-[var(--d-hover,#fbf8f1)]">
                  <item.icon aria-hidden="true" className="text-[15px] text-[var(--d-gold,#a67b2e)]" /> {t(item.label)}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
          <Card title="Verification status">
            <p className={`flex items-center gap-2 text-sm font-semibold ${verification.color}`}><verification.icon aria-hidden="true" /> {t(verification.title)}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{t(verification.text)}</p>
            {primary && <p className="mt-2 text-[11px] text-muted">{t('Profile ID {code}', { code: profileCode(primary.id) })}</p>}
          </Card>

          {primary?.completion.missing.length > 0 && (
            <Card title="Finish your profile">
              <ul className="grid gap-2">
                {primary.completion.missing.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <Link href={`/dashboard/${item.href}`} className="flex items-center justify-between gap-2 text-[13px] text-navy no-underline hover:text-[var(--d-gold,#9b712b)]">
                      {t(item.label)} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100 text-[10px] text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {primary?.consultant && (
            <Card title="Your consultant">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy"><FaUserTie aria-hidden="true" className="text-[var(--d-gold,#a67b2e)]" /> {primary.consultant.display_name}</p>
              <p className="mt-0.5 text-xs text-muted">{t(primary.consultant.title)}</p>
              <Link href={`/consultants/${primary.consultant.slug}`} className="mt-2 inline-block text-xs font-semibold text-[var(--d-gold,#9b712b)] no-underline">{t('View consultant')}</Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
