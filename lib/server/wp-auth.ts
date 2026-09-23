import "server-only";

// Customer-authentication integration point.
//
// WHY THIS FILE EXISTS AND WHAT IT DOES NOT DO:
// WooCommerce's REST API consumer key/secret (used elsewhere in this
// project for read-only product data — see lib/woocommerce.ts) is an
// ADMIN/store-integration credential. It cannot validate a customer's own
// email+password — WooCommerce/WordPress has no built-in endpoint that
// takes a customer's real account password over the public REST API and
// confirms it. Confirmed against this store's live REST API discovery
// (`/?rest_route=/`): no JWT or customer-auth plugin namespace is
// registered (no `jwt-auth`, `simple-jwt-login`, or similar). WordPress
// core's own `wp/v2/users/me` endpoint exists and requires authentication,
// but the only zero-plugin way to authenticate against it is WordPress's
// Application Passwords feature (core since 5.6), which issues a
// site-generated credential via a redirect/consent flow at
// /wp-admin/authorize-application.php — not the customer's real password
// typed into a form, and unconfirmed whether it's enabled on this install.
//
// So: there is currently no way to safely verify a customer's real
// WordPress/WooCommerce password from this server. Writing a fetch call
// against a guessed endpoint shape would be presenting untested, unverified
// code as if it worked — exactly what was asked not to do. Every function
// below is a clean, honestly-"unavailable" integration point instead,
// with the exact contract it needs once real credentials/an endpoint
// exist. See the Phase 2 report's "WordPress manual setup required"
// section for the two supported ways to close this gap.

export type LoginOutcome =
  | { ok: true; customerId: string; email: string; name?: string }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "service_unavailable" };

export type RegisterOutcome =
  | { ok: true; customerId: string }
  | { ok: false; reason: "duplicate_email" }
  | { ok: false; reason: "service_unavailable" };

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  salonName: string;
  certification: string;
  password: string;
}

/** WooCommerce customer meta keys this app writes salon/spa name and certification under. Documented here (and in the Phase 2 report) since they're not standard WooCommerce fields — visible in WordPress Admin's customer edit screen under Custom Fields once real registration is connected. */
export const CUSTOMER_META_KEYS = {
  salonName: "nag_salon_name",
  certification: "nag_certification",
} as const;

function authEndpointConfigured(): boolean {
  return Boolean(process.env.WORDPRESS_AUTH_ENDPOINT);
}

function adminApiConfigured(): boolean {
  return Boolean(process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET);
}

/**
 * Attempts to verify a customer's email/password against WordPress.
 *
 * TO CONNECT A REAL BACKEND: once WORDPRESS_AUTH_ENDPOINT is set (see the
 * Phase 2 report), replace the body of this function with a server-side
 * POST to that endpoint, passing { email, password } (or the plugin's
 * documented field names), over HTTPS. On success, resolve the
 * WooCommerce customer ID (either from the token response directly, or by
 * calling GET /wc/v3/customers?email=... with the admin consumer key —
 * see lib/server/woocommerce-admin.ts) and return { ok: true, customerId,
 * email }. On a rejected login, return { ok: false, reason:
 * "invalid_credentials" } — never a more specific reason, so the caller
 * can show one generic message and never reveal whether the email exists.
 */
export async function attemptLogin(email: string, password: string): Promise<LoginOutcome> {
  if (!authEndpointConfigured()) {
    return { ok: false, reason: "service_unavailable" };
  }
  // Unreachable until WORDPRESS_AUTH_ENDPOINT is configured — see the
  // block comment above for exactly what belongs here. Referencing the
  // params keeps the real signature future code will call without an
  // unused-var warning on an intentionally-unimplemented branch.
  void email;
  void password;
  return { ok: false, reason: "service_unavailable" };
}

/**
 * Attempts to create a WooCommerce customer.
 *
 * TO CONNECT A REAL BACKEND: once WOOCOMMERCE_CONSUMER_KEY/SECRET are set,
 * replace the body with a server-side POST to
 * `${WOOCOMMERCE_STORE_URL}/?rest_route=/wc/v3/customers` (Basic Auth with
 * the consumer key/secret — see lib/server/woocommerce-admin.ts for the
 * request helper), sending { email, first_name, last_name, username,
 * password, meta_data: [{ key: CUSTOMER_META_KEYS.salonName, value:
 * input.salonName }, { key: CUSTOMER_META_KEYS.certification, value:
 * input.certification }] } — WooCommerce itself rejects a duplicate email
 * with a 400 `registration-error-email-exists`, which maps to
 * `{ ok: false, reason: "duplicate_email" }` below. Phone isn't a native
 * WooCommerce customer field either; store it as billing.phone in the
 * same request.
 */
export async function registerCustomer(input: RegistrationInput): Promise<RegisterOutcome> {
  if (!adminApiConfigured()) {
    return { ok: false, reason: "service_unavailable" };
  }
  // Unreachable until WOOCOMMERCE_CONSUMER_KEY/SECRET are configured.
  void input;
  return { ok: false, reason: "service_unavailable" };
}
