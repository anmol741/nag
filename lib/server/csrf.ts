import "server-only";

/**
 * CSRF protection for the session cookie's state-changing routes (login,
 * register, logout, profile/address updates). Two layers, deliberately
 * simple rather than a token dance:
 *
 * 1. The session cookie is `SameSite=Lax` (see lib/server/session.ts),
 *    which browsers already refuse to attach on a cross-site POST/PUT/
 *    PATCH/DELETE — only top-level GET navigations carry it cross-site.
 * 2. This function double-checks the request's own Origin (falling back
 *    to Referer) against the site's real origin, so even a same-site-cookie
 *    edge case or a browser with weaker SameSite support is still covered.
 *
 * Every mutating Route Handler in app/api/auth and app/api/account calls
 * this before doing anything with the request body.
 */
export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin") ?? refererOrigin(request.headers.get("referer"));
  if (!origin) return false;

  const siteOrigin = new URL(request.url).origin;
  return origin === siteOrigin;
}

function refererOrigin(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}
