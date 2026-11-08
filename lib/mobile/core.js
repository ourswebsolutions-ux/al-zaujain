// The JSON API used by the Al Zaujain mobile app. It talks to the same database through the same
// library functions as the website, so accounts, profiles, searches and permissions are identical.
//
// Who is calling is decided by the "Authorization: Bearer <token>" header alone. Browser cookies are
// never read here, so another website cannot make a visitor's browser act through this API.
import { bearerToken, sessionUser } from '../auth.js';
import { UploadError } from '../uploads.js';

export const API_VERSION = 1;

export class ApiError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const fail = (message, status = 400, extra = {}) => { throw new ApiError(message, status, extra); };

export function requireMember(ctx) {
  if (!ctx.user) fail('Please sign in.', 401);
  return ctx.user;
}

export async function readJson(request) {
  try {
    return (await request.json()) ?? {};
  } catch {
    return {};
  }
}

export async function readForm(request) {
  try {
    return await request.formData();
  } catch {
    fail('The form could not be read. Please try again.', 400);
  }
}

// Turns "GET profiles/:code" route keys into matchers.
function compile(routes) {
  return Object.entries(routes).map(([key, handler]) => {
    const [method, pattern] = key.split(' ');
    const parts = pattern.split('/');
    return { method, parts, handler };
  });
}

function match(route, method, segments) {
  if (route.method !== method || route.parts.length !== segments.length) return null;
  const params = {};
  for (const [index, part] of route.parts.entries()) {
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(segments[index]);
    else if (part !== segments[index]) return null;
  }
  return params;
}

export function createRouter(routes) {
  const table = compile(routes);
  return async function handle(request, context) {
    const segments = (await context.params).path ?? [];
    const method = request.method;
    try {
      let params = null;
      const route = table.find((item) => (params = match(item, method, segments)));
      if (!route) {
        const known = table.some((item) => match({ ...item, method }, method, segments));
        return Response.json({ ok: false, message: known ? 'Method not allowed.' : 'Not found.' }, { status: known ? 405 : 404 });
      }
      const token = bearerToken(request.headers.get('authorization'));
      const user = await sessionUser(token);
      if (token && !user) return Response.json({ ok: false, message: 'Your session has ended. Please sign in again.', signedOut: true }, { status: 401 });
      const result = await route.handler({ request, params, query: request.nextUrl.searchParams, user, token });
      if (result instanceof Response) return result;
      return Response.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      if (error instanceof ApiError) return Response.json({ ok: false, message: error.message, ...error.extra }, { status: error.status });
      if (error instanceof UploadError) return Response.json({ ok: false, message: error.message }, { status: 422 });
      console.error('Mobile API error:', error);
      return Response.json({ ok: false, message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}
