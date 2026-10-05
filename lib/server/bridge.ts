import "server-only";
import { bridgeUrl, signBridgeRequest } from "@/lib/security/bridge-signing";

// Server-only client for the "Nag's Headless Bridge" WordPress plugin
// (wordpress/nags-headless-bridge). The plugin runs inside WordPress, so it
// can do what WooCommerce's REST API cannot: verify a customer's real
// WordPress password, manage email verification and approval, store
// certification files privately, and build orders through WooCommerce's
// own cart/checkout code (real prices, stock, coupons, tax and shipping).
//
// Every request is HMAC-signed with WORDPRESS_BRIDGE_SECRET (see
// lib/security/bridge-signing.ts). The secret is server-only — never a
// NEXT_PUBLIC_ variable, never logged, never sent to the browser.

const BRIDGE_BASE_URL = (process.env.WORDPRESS_BRIDGE_URL || process.env.WOOCOMMERCE_STORE_URL || "https://nagsbeautysupply.com").replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 20_000;

export type BridgeResult<T> =
  | { ok: true; data: T }
  /** Bridge not configured (no secret) or WordPress unreachable. */
  | { ok: false; reason: "service_unavailable" }
  /** The bridge understood the request and refused it, with a stable machine code and a customer-safe message. */
  | { ok: false; reason: "rejected"; code: string; message: string; status: number; details?: Record<string, unknown> }
  | { ok: false; reason: "upstream_error" };

export function bridgeConfigured(): boolean {
  return Boolean(process.env.WORDPRESS_BRIDGE_SECRET);
}

interface BridgeErrorBody {
  code?: unknown;
  message?: unknown;
  data?: { status?: unknown; details?: unknown };
}

export async function bridgeRequest<T>(route: string, payload: unknown, options: { timeoutMs?: number } = {}): Promise<BridgeResult<T>> {
  const secret = process.env.WORDPRESS_BRIDGE_SECRET;
  if (!secret) return { ok: false, reason: "service_unavailable" };

  const body = JSON.stringify(payload ?? {});
  const headers = signBridgeRequest(secret, "POST", route, body);

  let response: Response;
  try {
    response = await fetch(bridgeUrl(BRIDGE_BASE_URL, route), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    // Never log the body — it can contain passwords or documents.
    console.error(`[bridge] network error on ${route}:`, error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "service_unavailable" };
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (response.ok) {
    return { ok: true, data: json as T };
  }

  const err = (json ?? {}) as BridgeErrorBody;
  const code = typeof err.code === "string" ? err.code : "";
  // A route-not-found from WordPress means the plugin isn't installed/active.
  if (response.status === 404 && code === "rest_no_route") {
    console.error(`[bridge] plugin route missing (${route}) — is the Nag's Headless Bridge plugin active?`);
    return { ok: false, reason: "service_unavailable" };
  }
  if (code.startsWith("nag_")) {
    return {
      ok: false,
      reason: "rejected",
      code,
      message: typeof err.message === "string" ? err.message : "Request could not be completed.",
      status: response.status,
      details: err.data?.details && typeof err.data.details === "object" ? (err.data.details as Record<string, unknown>) : undefined,
    };
  }

  console.error(`[bridge] unexpected ${response.status} on ${route} (code=${code || "none"})`);
  return { ok: false, reason: "upstream_error" };
}
