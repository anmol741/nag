import "server-only";

/**
 * Best-effort in-memory rate limiter for login/registration attempts.
 *
 * IMPORTANT LIMITATION: this Map lives in a single server process's
 * memory. On Netlify (serverless functions), each invocation can run in a
 * fresh, isolated instance with its own empty Map, and multiple instances
 * can run concurrently under load — so this does NOT reliably enforce a
 * global limit in production. It still helps against a single naive
 * scripted retry loop hitting a warm instance, and costs nothing to keep.
 * For a real production guarantee, replace this with a shared store (e.g.
 * Upstash Redis, or Netlify Blobs/Edge Config) keyed the same way — see
 * the Phase 2 report's manual-configuration section.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/** Checks and consumes one attempt for `key` within a sliding window. */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}

/** Best-effort caller IP for rate-limit keying — trusts the first hop's forwarded header, which is fine for slowing casual abuse but not a hardened source-of-truth without a trusted, fixed proxy in front. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
