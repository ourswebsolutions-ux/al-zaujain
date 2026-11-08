import { FaLock, FaUnlock } from 'react-icons/fa6';
import { Card, PageHeader } from '@/components/member/Ui';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth.js';
import { getT } from '@/lib/i18n/server.js';
import { getRestrictions, hasPaidAccess, RESTRICTIONS } from '@/lib/restrictions.js';

export default async function UnlockedAccess() {
  const user = await requireUser('/dashboard/payments/unlocked');
  const t = await getT();
  const [restrictions, paid] = await Promise.all([getRestrictions(), hasPaidAccess(user.id)]);
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader title="Unlocked Profile Access" text="What you can see on matrimonial profiles." />
      <Card>
        <ul className="divide-y divide-[var(--d-line,#eef0f3)]">
          {RESTRICTIONS.map((item) => {
            const open = paid || !restrictions[item.key];
            return (
              <li key={item.key} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                <span className="text-navy">{t(item.label)}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${open ? 'text-[var(--d-green,#1f8a3a)]' : 'text-[var(--d-gold,#946c13)]'}`}>{open ? <FaUnlock aria-hidden="true" /> : <FaLock aria-hidden="true" />} {t(open ? 'Unlocked' : 'Locked')}</span>
              </li>
            );
          })}
        </ul>
        {!paid && <div className="mt-5"><ButtonLink tone="gold" size="md" href="/dashboard/payments/submit">{t('View Payment Options')}</ButtonLink></div>}
      </Card>
    </div>
  );
}
