// Pure origin-allowlist logic for CSRF protection — no Next.js or
// server-only imports, so it can be unit tested directly (see
// tests/origin.test.ts). lib/server/csrf.ts builds the context from the
// real request and environment.
//
// WHY THIS EXISTS (the live 403 on registration): the original check
// compared the browser's Origin against `new URL(request.url).origin`. On
// Netlify, a page opened on a branch or deploy URL
// (e.g. https://main--taupe-buttercream-c55e75.netlify.app) is served by
// the same function, but `request.url` reports the site's *primary* URL —
// so every POST from those URLs was rejected. Origins are now checked
// against an explicit allowlist instead, never against an arbitrary value.

export interface OriginContext {
  /** Exact origins from configuration (NEXT_PUBLIC_SITE_URL, ALLOWED_ORIGINS, Netlify's URL/DEPLOY_PRIME_URL/DEPLOY_URL). */
  configuredOrigins: string[];
  /** The origin this server believes it is serving (from request.url). */
  requestOrigin: string | null;
  /** True outside production, where http://localhost:<port> is also accepted. */
  allowLocalhost: boolean;
  /** When true, Netlify branch/deploy subdomains of a configured *.netlify.app site are accepted (see isNetlifyDeployOriginOf). */
  allowNetlifyDeploySubdomains: boolean;
}

/** Normalizes a URL-ish string to its origin (scheme://host[:port]), or null if it isn't a valid http(s) URL. */
export function toOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Splits a comma-separated env value into normalized origins, dropping anything invalid. */
export function parseOriginList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => toOrigin(part))
    .filter((origin): origin is string => origin !== null);
}

/**
 * True when `origin` is a Netlify branch or deploy URL of the *same* site as
 * `siteOrigin`: https://<label>--<site>.netlify.app, where <site> must match
 * exactly. Never matches another Netlify site, a non-https origin, or a
 * nested subdomain.
 */
export function isNetlifyDeployOriginOf(origin: string, siteOrigin: string): boolean {
  let site: URL;
  let candidate: URL;
  try {
    site = new URL(siteOrigin);
    candidate = new URL(origin);
  } catch {
    return false;
  }
  if (site.protocol !== "https:" || candidate.protocol !== "https:") return false;
  if (candidate.port !== "" || site.port !== "") return false;

  const siteMatch = /^([a-z0-9-]+)\.netlify\.app$/i.exec(site.hostname);
  if (!siteMatch) return false;
  const siteName = siteMatch[1].toLowerCase();

  const candidateMatch = /^([a-z0-9-]+)--([a-z0-9-]+)\.netlify\.app$/i.exec(candidate.hostname);
  if (!candidateMatch) return false;
  return candidateMatch[2].toLowerCase() === siteName;
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

/** Decides whether a browser-supplied Origin may perform a state-changing request. */
export function isAllowedOrigin(rawOrigin: string | null, context: OriginContext): boolean {
  const origin = toOrigin(rawOrigin);
  if (!origin) return false;

  const exact = new Set(context.configuredOrigins);
  if (context.requestOrigin) exact.add(context.requestOrigin);
  if (exact.has(origin)) return true;

  if (context.allowLocalhost && isLocalhostOrigin(origin)) return true;

  if (context.allowNetlifyDeploySubdomains) {
    for (const configured of exact) {
      if (isNetlifyDeployOriginOf(origin, configured)) return true;
    }
  }
  return false;
}

/**
 * Full same-origin decision for a request's headers. Uses Origin when the
 * browser sent one (all modern browsers do on fetch POST/PUT/PATCH/DELETE),
 * else falls back to the Referer's origin. A `Sec-Fetch-Site: cross-site`
 * header (browser-set, cannot be forged by page script) is always rejected.
 */
export function isSameOriginRequest(
  headers: { origin: string | null; referer: string | null; secFetchSite: string | null },
  context: OriginContext
): boolean {
  if (headers.secFetchSite === "cross-site") return false;
  const candidate = headers.origin && headers.origin !== "null" ? headers.origin : toOrigin(headers.referer);
  return isAllowedOrigin(candidate, context);
}
