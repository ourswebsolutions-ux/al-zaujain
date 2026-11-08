import { Button } from '@/components/ui/Button';
import { inputSm } from './styles';
import { getT } from '@/lib/i18n/server.js';

export async function RejectForm({ action, id }) {
  const t = await getT();
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" aria-label={t('Reason for rejection')} placeholder={t('Reason, sent to the member')} maxLength={300} className={`${inputSm} w-64`} />
      <Button type="submit" tone="danger" size="sm" className="cursor-pointer">{t('Reject')}</Button>
    </form>
  );
}
