import { FaHeartCircleCheck } from 'react-icons/fa6';
import { MatchCard } from '@/components/member/MatchCard';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { savedCodes } from '@/lib/engagement.js';
import { matchesForUser } from '@/lib/matching.js';
import { getT } from '@/lib/i18n/server.js';

export default async function MatchesPage() {
  const t = await getT();
  const user = await requireUser('/dashboard/matches');
  const [{ profile, matches }, saved] = await Promise.all([matchesForUser(user.id, 24), savedCodes(user.id)]);
  return (
    <>
      <PageHeader title={t('Recommended matches')} text={profile ? t('Proposals suited to {name}, ranked by compatibility on both sides.', { name: profile.display_name }) : 'Proposals ranked for your profile.'} />
      {matches.length > 0 ? (
        <div className="grid grid-cols-4 gap-5 max-[1280px]:grid-cols-3 max-p:grid-cols-2 max-g:grid-cols-1">
          {matches.map((card) => <MatchCard key={card.code} card={card} saved={saved.has(card.code)} />)}
        </div>
      ) : (
        <EmptyState icon={<FaHeartCircleCheck aria-hidden="true" />} title={profile ? 'No matches yet' : 'Your matches are waiting for your profile'} text={profile ? 'We will notify you when suitable proposals arrive.' : 'Recommendations begin once your profile is approved.'} action={<ButtonLink tone="gold" href={profile ? '/proposals' : '/dashboard/profile'}>{t(profile ? 'Browse proposals' : 'View my profile')}</ButtonLink>} />
      )}
    </>
  );
}
