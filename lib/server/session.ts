import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Server-only signed session cookie. This is intentionally NOT a JWT
// library or a third-party session package — it's a small, dependency-free
// HMAC-signed cookie, which is all a same-origin session needs here and
// keeps the trust boundary easy to audit. The cookie holds only a customer
// ID, email, and expiry — never a password, never a WordPress token, and
// it is never readable from client-side JavaScript (HttpOnly).
//
// SESSION_SECRET must be set in the server environment (see the Phase 2
// report's "Environment variables" section) — a random 32+ byte value,
// e.g. `openssl rand -base64 32`. Never commit it; never log it.

const COOKIE_NAME = "nagsbeauty_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  /** WooCommerce/WordPress customer (user) ID — the sole source of truth for "who is this", never trusted from the client otherwise. */
  sub: string;
  email: string;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expires-at, unix seconds. */
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Sessions cannot be created or verified without it — see the Phase 2 report's environment variable requirements."
    );
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Encodes and signs a session payload into the opaque cookie value. Never includes a password or WordPress token. */
function encodeSession(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

/** Verifies the signature and expiry of a raw cookie value, returning the payload or null if invalid/expired/tampered. */
function decodeSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Constant-time comparison — a naive === here would leak timing
  // information about how many leading bytes of the signature matched.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

/** Sets the signed session cookie. Call only after credentials have been verified server-side — never speculatively. */
export async function createSession(customerId: string, email: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: customerId, email, iat: now, exp: now + SESSION_TTL_SECONDS };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

let warnedMissingSecret = false;

/**
 * Reads and verifies the current request's session, or null if
 * absent/invalid/expired. Safe to call from a Server Component, Route
 * Handler, or Proxy. Called on effectively every request (the root layout
 * needs it for Header's logged-in state) — a missing SESSION_SECRET must
 * degrade to "logged out" everywhere rather than crash every single page,
 * so this is the one place that catches that case instead of letting it
 * throw. createSession() above still throws loudly on a missing secret,
 * since that path only runs after a real login success and should never
 * silently pretend to issue a session it can't actually sign.
 */
export async function getSession(): Promise<SessionPayload | null> {
  if (!process.env.SESSION_SECRET) {
    if (!warnedMissingSecret) {
      console.warn("[session] SESSION_SECRET is not set — every visitor is treated as logged out. See the Phase 2 report.");
      warnedMissingSecret = true;
    }
    return null;
  }
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(COOKIE_NAME)?.value);
}

/** Clears the session cookie (logout). */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
