import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { bridgeRequest } from "./bridge";

// Server-only signed session cookie. A small, dependency-free HMAC-signed
// cookie — easy to audit. It holds the customer ID, email, expiry and an
// opaque WordPress session token (`sid`) — never a password — and is never
// readable from client-side JavaScript (HttpOnly).
//
// The `sid` is a real WordPress session token (WP_Session_Tokens), issued
// by the bridge plugin at login. That's what makes logout and password
// resets real: logging out destroys the token in WordPress, and a password
// reset destroys all of the user's tokens, so a copied cookie stops working
// even before it expires. getVerifiedSession() checks the token with
// WordPress; getSession() alone only checks the signature/expiry and is
// used for cheap, non-sensitive decisions (e.g. which header icon to show).
//
// SESSION_SECRET must be set server-side (random 32+ bytes, e.g.
// `openssl rand -base64 32`). Never commit it; never log it.

// __Host- prefix (production/HTTPS only): the browser refuses the cookie
// unless it is Secure, Path=/ and has no Domain — so no subdomain can
// overwrite it.
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-nagsbeauty_session" : "nagsbeauty_session";
const DEFAULT_TTL_HOURS = 72;

export function sessionTtlSeconds(): number {
  const hours = Number.parseInt(process.env.SESSION_TTL_HOURS ?? "", 10);
  const safe = Number.isFinite(hours) && hours >= 1 && hours <= 24 * 30 ? hours : DEFAULT_TTL_HOURS;
  return safe * 60 * 60;
}

export interface SessionPayload {
  /** WooCommerce/WordPress customer (user) ID — the sole source of truth for "who is this", never trusted from the client otherwise. */
  sub: string;
  email: string;
  /** WordPress session token, verified against WordPress for anything sensitive. */
  sid: string;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expires-at, unix seconds. */
  exp: number;
}

export type ApprovalState = "legacy" | "pending" | "approved" | "rejected";

/** Account standing, as reported by WordPress on every verified request — never cached in the cookie, so an approval or rejection takes effect immediately. */
export interface AccountStatus {
  emailVerified: boolean;
  approval: ApprovalState;
  wholesale: boolean;
  canCheckout: boolean;
}

export interface VerifiedSession extends SessionPayload {
  status: AccountStatus;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set. Sessions cannot be created or verified without it.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verifies the signature and expiry of a raw cookie value, returning the payload or null if invalid/expired/tampered. */
function decodeSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(body));
  // Constant-time comparison.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Sets the signed session cookie. Call only after WordPress has verified the credentials and issued `sessionToken`. */
export async function createSession(customerId: string, email: string, sessionToken: string): Promise<void> {
  const ttl = sessionTtlSeconds();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: customerId, email, sid: sessionToken, iat: now, exp: now + ttl };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

let warnedMissingSecret = false;

/**
 * Reads the signed cookie (signature + expiry only), or null. Cheap — no
 * network call. Safe for Server Components, Route Handlers and Proxy.
 * A missing SESSION_SECRET degrades to "logged out" instead of crashing
 * every page.
 */
export async function getSession(): Promise<SessionPayload | null> {
  if (!process.env.SESSION_SECRET) {
    if (!warnedMissingSecret) {
      console.warn("[session] SESSION_SECRET is not set — every visitor is treated as logged out.");
      warnedMissingSecret = true;
    }
    return null;
  }
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(COOKIE_NAME)?.value);
}

// Short per-instance cache so a page that makes several account calls
// doesn't re-verify with WordPress each time. Kept short on purpose: a
// logout/reset on another server instance takes effect within this window.
const VERIFY_CACHE_MS = 30_000;
const verifyCache = new Map<string, { status: AccountStatus; expiresAt: number }>();

function cacheKey(session: SessionPayload): string {
  return createHash("sha256").update(`${session.sub}:${session.sid}`).digest("hex");
}

export type VerifiedSessionResult =
  | { state: "valid"; session: VerifiedSession }
  | { state: "none" }
  | { state: "unavailable" };

/**
 * Full session check: signature/expiry AND that WordPress still recognises
 * the session token (not logged out, not invalidated by a password reset,
 * account not deleted). Returns the live account status too.
 */
export async function getVerifiedSession(): Promise<VerifiedSessionResult> {
  const session = await getSession();
  if (!session) return { state: "none" };

  const key = cacheKey(session);
  const cached = verifyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { state: "valid", session: { ...session, status: cached.status } };
  }

  const result = await bridgeRequest<{ valid: boolean; status?: AccountStatus }>("/auth/session", {
    userId: session.sub,
    token: session.sid,
  });

  if (!result.ok) {
    if (result.reason === "rejected") {
      verifyCache.delete(key);
      return { state: "none" };
    }
    return { state: "unavailable" };
  }
  if (!result.data.valid || !result.data.status) {
    verifyCache.delete(key);
    return { state: "none" };
  }

  if (verifyCache.size > 5000) verifyCache.clear();
  verifyCache.set(key, { status: result.data.status, expiresAt: Date.now() + VERIFY_CACHE_MS });
  return { state: "valid", session: { ...session, status: result.data.status } };
}

/** Drops this instance's cached verification for a session (used on logout). */
export function forgetVerifiedSession(session: SessionPayload): void {
  verifyCache.delete(cacheKey(session));
}

/** Clears the session cookie (logout). */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
