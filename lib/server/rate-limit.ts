import "server-only";

/**
 * First-layer, in-memory rate limiter for login, registration, password
 * reset, verification resends and checkout.
 *
 * LIMITATION: this Map lives in one server instance's memory. On Netlify
 * each function instance has its own, so this alone is not a global limit.
 * The authoritative limits are enforced again inside WordPress by the
 * bridge plugin (stored in WordPress transients, shared across all
 * requests, keyed by both IP and email) — see
 * wordpress/nags-headless-bridge/includes/class-nag-rate-limit.php.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/** Checks and consumes one attempt for `key` within a fixed window. */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}

/**
 * Best-effort caller IP. Netlify sets `x-nf-client-connection-ip` itself
 * (a client can't spoof it through Netlify's edge), so it's preferred over
 * X-Forwarded-For, whose first hop is client-controlled.
 */
export function getClientIp(request: Request): string {
  const netlify = request.headers.get("x-nf-client-connection-ip");
  if (netlify) return netlify.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
