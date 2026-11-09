// The mobile app opens the admin or consultant panel here with a one-minute link from
// POST /api/mobile/staff/web-link. A valid link signs the in-app browser in and opens the panel.
import { createSession } from '@/lib/auth.js';
import { panelPath, userFromWebLink } from '@/lib/mobile/staff.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const user = await userFromWebLink(params.get('t'));
  if (!user) return new Response(null, { status: 303, headers: { Location: '/login', 'Cache-Control': 'no-store' } });
  await createSession(user.id);
  return new Response(null, { status: 303, headers: { Location: panelPath(user.role, params.get('next')), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
