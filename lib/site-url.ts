/**
 * Resolves the absolute, public URL this app is served from, for building
 * shareable links (social share URLs, canonical/OG metadata, sitemap
 * entries). Priority:
 *
 *   1. NEXT_PUBLIC_SITE_URL — set explicitly for this deploy (see .env.example)
 *   2. URL — Netlify's own env var for the site's primary URL, when deployed there
 *   3. http://localhost:3000 — local development fallback
 *
 * Trailing slashes are stripped so callers can safely do `${getSiteUrl()}/path`.
 *
 * Server-side only: `URL` is a plain (non `NEXT_PUBLIC_`) env var, so it's
 * only readable in Server Components/route handlers, not in the browser.
 * Compute the URL server-side and pass it down as a prop where a Client
 * Component needs it.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
