// Pure input validation/normalization — no secrets, safe to import from
// both client components (for immediate form feedback) and server routes
// (see app/api/auth, app/api/account, proxy.ts). The server side never
// trusts the client-side check alone: every route re-runs these itself.

/** Trims and lowercases an email address. Does not attempt provider-specific tricks (Gmail dot/plus folding etc.) — those cause false "duplicate" positives for real, distinct inboxes at other providers. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Canadian postal code, e.g. "V3A 3X7" or "v3a3x7" — accepts with or
 * without the space and in either case, normalizes to "A1A 1A1". Rejects
 * D, F, I, O, Q, U as the first letter (never used by Canada Post) and W/Z
 * in the first position, matching the real format.
 */
const POSTAL_CODE_PATTERN = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?(\d[ABCEGHJ-NPRSTV-Z]\d)$/i;

export function isValidCanadianPostalCode(value: string): boolean {
  return POSTAL_CODE_PATTERN.test(value.trim());
}

export function normalizeCanadianPostalCode(value: string): string {
  const match = POSTAL_CODE_PATTERN.exec(value.trim());
  if (!match) return value.trim().toUpperCase();
  return `${match[1]} ${match[2]}`.toUpperCase();
}

/**
 * Sensible-but-not-strict Canadian phone check: strips formatting
 * (spaces, dashes, dots, parens, an optional leading +1/1), then requires
 * exactly 10 digits with a plausible area code (not starting with 0 or 1).
 * Accepts any common way a customer might type it — (778) 278-7727,
 * 778-278-7727, 778.278.7727, +1 778 278 7727, etc.
 */
export function isValidCanadianPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "").replace(/^1(?=\d{10}$)/, "");
  return /^[2-9]\d{9}$/.test(digits);
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length !== 10) return value.trim();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Minimum bar this frontend enforces: 8+ characters with at least one
 * letter and one number. This is a client/server UX guardrail only — once
 * a real WordPress auth endpoint exists, WordPress's own password rules
 * (and any policy plugin) apply independently and may be stricter.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Restricts a `returnTo` redirect target to an internal site path, so it
 * can never be used as an open redirect. Rejects anything that isn't a
 * plain path starting with a single `/` (no `//`, no `\`, no protocol,
 * no embedded scheme like `/\evil.com` or `javascript:`).
 */
export function isSafeReturnPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("://")) return false;
  // A relative URL parse against a fixed base is the most reliable way to
  // catch anything that would still resolve off-origin (e.g. "/\t/evil.com"
  // tricks some parsers normalize away).
  try {
    const resolved = new URL(value, "https://internal.invalid");
    return resolved.origin === "https://internal.invalid";
  } catch {
    return false;
  }
}
