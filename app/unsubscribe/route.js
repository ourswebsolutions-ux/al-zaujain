import { getDb } from '@/lib/db.js';
import { verifySignature } from '@/lib/security.js';

export async function GET(request) {
  const userId = Number(request.nextUrl.searchParams.get('u'));
  const signature = request.nextUrl.searchParams.get('t') ?? '';
  const valid = userId > 0 && verifySignature(`unsubscribe:${userId}`, signature);
  if (valid) await getDb().user.update({ where: { id: userId }, data: { match_emails: false } });
  const message = valid ? 'You will no longer receive match emails. You can turn them back on from your account settings.' : 'This link is not valid.';
  return new Response(`<!doctype html><title>Al Zaujain</title><p>${message}</p><p><a href="/">Back to Al Zaujain</a></p>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
