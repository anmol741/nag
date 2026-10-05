import "server-only";
import { isSameOriginRequest, parseOriginList, toOrigin, type OriginContext } from "@/lib/security/origin";

/**
 * CSRF protection for every state-changing route (login, register, logout,
 * password reset, account updates, wishlist, checkout). Two layers:
 *
 * 1. The session cookie is `SameSite=Lax` (see lib/server/session.ts),
 *    which browsers refuse to attach on a cross-site POST/PUT/PATCH/DELETE.
 * 2. This function checks the request's Origin (falling back to Referer)
 *    against an explicit allowlist — see lib/security/origin.ts for why it
 *    no longer compares against `request.url` (the live Netlify 403).
 *
 * Allowed origins: NEXT_PUBLIC_SITE_URL, ALLOWED_ORIGINS (comma-separated,
 * exact origins), Netlify's own URL / DEPLOY_PRIME_URL / DEPLOY_URL, the
 * request's own origin, and — only when the configured site is a
 * *.netlify.app site — that same site's branch/deploy subdomains. Set
 * ALLOW_NETLIFY_DEPLOY_ORIGINS=false to turn the last one off.
 */
function buildContext(request: Request): OriginContext {
  const configuredOrigins = [
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    toOrigin(process.env.URL),
    toOrigin(process.env.DEPLOY_PRIME_URL),
    toOrigin(process.env.DEPLOY_URL),
    ...parseOriginList(process.env.ALLOWED_ORIGINS),
  ].filter((origin): origin is string => origin !== null);

  return {
    configuredOrigins,
    requestOrigin: toOrigin(request.url),
    allowLocalhost: process.env.NODE_ENV !== "production",
    allowNetlifyDeploySubdomains: process.env.ALLOW_NETLIFY_DEPLOY_ORIGINS !== "false",
  };
}

export function verifySameOrigin(request: Request): boolean {
  return isSameOriginRequest(
    {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      secFetchSite: request.headers.get("sec-fetch-site"),
    },
    buildContext(request)
  );
}
