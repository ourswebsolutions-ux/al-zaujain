// A same-origin check for JSON and multipart routes. Server Actions get this from Next.js.
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return request.method === 'GET';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const jsonError = (message, status = 400, extra = {}) => Response.json({ ok: false, message, ...extra }, { status });
