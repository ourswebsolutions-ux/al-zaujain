import { FaHeart } from 'react-icons/fa6';
import { MatchCard } from '@/components/member/MatchCard';
import { EmptyState, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { savedProfiles } from '@/lib/engagement.js';
import { getT } from '@/lib/i18n/server.js';

export default async function SavedPage() {
  const t = await getT();
  const user = await requireUser('/dashboard/saved');
  const profiles = await savedProfiles(user.id);
  return (
    <>
      <PageHeader title={t('Saved profiles')} text={t('Your private shortlist. Nobody is told when you save them.')} />
      {profiles.length > 0 ? (
        <div className="grid grid-cols-4 gap-5 max-[1280px]:grid-cols-3 max-p:grid-cols-2 max-g:grid-cols-1">
          {profiles.map((card) => <MatchCard key={card.code} card={card} saved />)}
        </div>
      ) : <EmptyState icon={<FaHeart aria-hidden="true" />} title={t('No saved profiles yet')} text={t('Tap the heart on any proposal to keep it here.')} action={<ButtonLink tone="gold" href="/proposals">{t('Browse proposals')}</ButtonLink>} />}
    </>
  );
}
