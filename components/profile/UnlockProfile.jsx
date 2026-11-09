'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { FaCartShopping, FaCircleCheck, FaCoins, FaCrown, FaLockOpen } from 'react-icons/fa6';
import { unlockProfileAction } from '@/app/actions/credits';
import { useT } from '@/components/i18n/LanguageProvider';
import { Button, ButtonLink } from '@/components/ui/Button';

function UnlockButton({ cost }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" tone="gold" disabled={pending} className="w-full cursor-pointer">
      <FaLockOpen aria-hidden="true" /> {pending ? t('Unlocking…') : cost === 1 ? t('Unlock profile · 1 credit') : t('Unlock profile · {cost} credits', { cost })}
    </Button>
  );
}

// Premium (paid) profiles: the member spends credits once and the profile stays open for them.
// Every decision is made on the server; this only shows the result.
export function UnlockProfile({ code, credits, signedIn }) {
  const t = useT();
  const [state, action] = useActionState(unlockProfileAction, null);
  if (!credits) return null;
  if (credits.unlocked) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-[#eef4ef] p-3 text-start text-xs font-semibold leading-5 text-[#3d6b4a]">
        <FaCircleCheck aria-hidden="true" className="mt-0.5 shrink-0" /> {t('Unlocked with your credits. The photo and contact details are open for you.')}
      </p>
    );
  }
  if (!credits.canUnlock) return null;
  const short = signedIn && credits.balance !== null && credits.balance < credits.cost;
  return (
    <section id="unlock" className="scroll-mt-6 rounded-2xl border border-[#ddcfb1] bg-[linear-gradient(160deg,#fcf4e1,#f8f4eb)] p-4 text-start">
      <p className="flex items-center gap-2 text-[13px] font-bold text-navy"><FaCrown aria-hidden="true" className="text-gold" /> {t('Premium profile')}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{credits.cost === 1 ? t('Unlock the real photo and contact details for 1 credit. Once unlocked, it stays open for you.') : t('Unlock the real photo and contact details for {cost} credits. Once unlocked, it stays open for you.', { cost: credits.cost })}</p>
      {signedIn && credits.balance !== null && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#806126]"><FaCoins aria-hidden="true" /> {t('You have {count} credits', { count: credits.balance })}</p>}
      <div className="mt-3 grid gap-2 [&_a]:w-full">
        {!signedIn ? (
          <ButtonLink tone="gold" href={`/login?next=/profile/${code}`}><FaLockOpen aria-hidden="true" /> {t('Sign in to unlock')}</ButtonLink>
        ) : short ? (
          <>
            <p role="status" className="rounded-lg bg-white/70 px-3 py-2 text-xs font-medium leading-5 text-[#a33a2c]">{t('You do not have enough credits. Buy a package to unlock this profile.')}</p>
            <ButtonLink tone="gold" href="/dashboard/credits/buy"><FaCartShopping aria-hidden="true" /> {t('Buy Premium Credits')}</ButtonLink>
          </>
        ) : (
          <form action={action}>
            <input type="hidden" name="code" value={code} />
            <UnlockButton cost={credits.cost} />
          </form>
        )}
        {state?.message && (
          <p role="status" className={`rounded-lg px-3 py-2 text-xs font-medium leading-5 ${state.ok ? 'bg-[#eef4ef] text-[#3d6b4a]' : 'bg-[#fbeeec] text-[#a33a2c]'}`}>{t(state.message, state)}</p>
        )}
        {state?.insufficient && <ButtonLink tone="navy" href="/dashboard/credits/buy"><FaCartShopping aria-hidden="true" /> {t('Buy Premium Credits')}</ButtonLink>}
      </div>
    </section>
  );
}
