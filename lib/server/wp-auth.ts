import "server-only";
import { bridgeRequest } from "./bridge";
import { sessionTtlSeconds, type AccountStatus } from "./session";

// Customer authentication against the existing WordPress/WooCommerce user
// table, through the Nag's Headless Bridge plugin (see lib/server/bridge.ts
// and wordpress/nags-headless-bridge). WordPress remains the only customer
// database: passwords are checked by WordPress's own wp_authenticate(),
// accounts are real WooCommerce customers, and nothing is duplicated here.
//
// Every function returns a small outcome union so routes can show one
// generic, non-enumerating message where that matters (login, forgot
// password, resend verification).

/**
 * WooCommerce customer meta keys this app reads (full list in the plugin
 * README). Status flags (`_nag_email_verified`, `_nag_approval_status`,
 * `_nag_wholesale_access`) are underscore-prefixed protected meta, written
 * only by the plugin — this app never writes them.
 */
export const CUSTOMER_META_KEYS = {
  salonName: "nag_salon_name",
  /** "on_file" once a certification document is stored; the file itself lives in protected `_nag_cert_*` meta. */
  certification: "nag_certification",
} as const;

export type LoginOutcome =
  | { ok: true; customerId: string; email: string; sessionToken: string; status: AccountStatus }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "account_rejected" }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "service_unavailable" };

export async function attemptLogin(email: string, password: string, clientIp: string): Promise<LoginOutcome> {
  const result = await bridgeRequest<{ userId: number; email: string; token: string; status: AccountStatus }>("/auth/login", {
    email,
    password,
    ip: clientIp,
    // WordPress session token lifetime matches the cookie's.
    ttl: sessionTtlSeconds(),
  });
  if (result.ok) {
    return { ok: true, customerId: String(result.data.userId), email: result.data.email, sessionToken: result.data.token, status: result.data.status };
  }
  if (result.reason === "rejected") {
    if (result.code === "nag_rate_limited") return { ok: false, reason: "rate_limited" };
    if (result.code === "nag_account_rejected") return { ok: false, reason: "account_rejected" };
    return { ok: false, reason: "invalid_credentials" };
  }
  return { ok: false, reason: "service_unavailable" };
}

export async function revokeSessionToken(customerId: string, token: string): Promise<void> {
  await bridgeRequest("/auth/logout", { userId: customerId, token });
}

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  salonName: string;
  password: string;
  agreedToTermsAt: string;
  certification: {
    fileName: string;
    mimeType: string;
    extension: string;
    base64: string;
  };
}

export type RegisterOutcome =
  | { ok: true }
  | { ok: false; reason: "duplicate_email" }
  | { ok: false; reason: "invalid"; message: string; fieldErrors?: Record<string, string> }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "service_unavailable" };

/**
 * Creates a WooCommerce customer with: email unverified, approval pending,
 * wholesale disabled. The plugin stores the certification file in a
 * private, non-listable directory and emails the verification link and the
 * administrator notification.
 */
export async function registerCustomer(input: RegistrationInput, clientIp: string): Promise<RegisterOutcome> {
  const result = await bridgeRequest<{ ok: true }>("/auth/register", { ...input, ip: clientIp }, { timeoutMs: 45_000 });
  if (result.ok) return { ok: true };
  if (result.reason === "rejected") {
    if (result.code === "nag_email_exists") return { ok: false, reason: "duplicate_email" };
    if (result.code === "nag_rate_limited") return { ok: false, reason: "rate_limited" };
    const fieldErrors = result.details?.fieldErrors;
    return {
      ok: false,
      reason: "invalid",
      message: result.message,
      fieldErrors: fieldErrors && typeof fieldErrors === "object" ? (fieldErrors as Record<string, string>) : undefined,
    };
  }
  return { ok: false, reason: "service_unavailable" };
}

export type SimpleOutcome = { ok: true } | { ok: false; reason: "invalid" | "rate_limited" | "service_unavailable"; message?: string };

function toSimple(result: Awaited<ReturnType<typeof bridgeRequest>>): SimpleOutcome {
  if (result.ok) return { ok: true };
  if (result.reason === "rejected") {
    if (result.code === "nag_rate_limited") return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "invalid", message: result.message };
  }
  return { ok: false, reason: "service_unavailable" };
}

export async function verifyEmailToken(userId: string, token: string): Promise<SimpleOutcome> {
  return toSimple(await bridgeRequest("/auth/verify-email", { userId, token }));
}

/** Always resolves "ok" for an unknown email (no enumeration) — the plugin only sends when an unverified account exists. */
export async function resendVerification(email: string, clientIp: string): Promise<SimpleOutcome> {
  return toSimple(await bridgeRequest("/auth/resend-verification", { email, ip: clientIp }));
}

/** Always resolves "ok" for an unknown email (no enumeration). Uses WordPress's own reset key (get_password_reset_key). */
export async function requestPasswordReset(email: string, clientIp: string): Promise<SimpleOutcome> {
  return toSimple(await bridgeRequest("/auth/password/forgot", { email, ip: clientIp }));
}

/** Uses WordPress's own check_password_reset_key()/reset_password(); all existing sessions are destroyed on success. */
export async function resetPassword(login: string, key: string, password: string, clientIp: string): Promise<SimpleOutcome> {
  return toSimple(await bridgeRequest("/auth/password/reset", { login, key, password, ip: clientIp }));
}
