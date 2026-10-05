// Netlify Scheduled Function — hourly backup trigger for cancelling unpaid
// e-Transfer orders older than three days.
//
// The cancellation itself runs inside WordPress (the bridge plugin's
// Nag_Orders::cancel_unpaid_etransfer_orders), where WooCommerce restores
// stock and coupon usage through its normal "cancelled" workflow. WordPress
// also schedules it with WP-Cron; this function exists because WP-Cron only
// runs when the WordPress site gets traffic. Running it twice is harmless —
// the plugin takes a lock and re-checks each order's status and payment.
//
// Nothing here runs in a browser. Netlify only runs scheduled functions on
// published production deploys.

import { bridgeUrl, signBridgeRequest } from "../../lib/security/bridge-signing";

const ROUTE = "/maintenance/cancel-unpaid";

export default async function handler(): Promise<Response> {
  const secret = process.env.WORDPRESS_BRIDGE_SECRET;
  if (!secret) {
    console.warn("[cancel-unpaid-etransfer] WORDPRESS_BRIDGE_SECRET not set — skipping");
    return new Response("not configured", { status: 200 });
  }
  const base = process.env.WORDPRESS_BRIDGE_URL || process.env.WOOCOMMERCE_STORE_URL || "https://nagsbeautysupply.com";
  const body = "{}";

  try {
    const res = await fetch(bridgeUrl(base, ROUTE), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...signBridgeRequest(secret, "POST", ROUTE, body) },
      body,
      signal: AbortSignal.timeout(25_000),
    });
    const data = (await res.json().catch(() => ({}))) as { cancelled?: number; code?: string };
    console.log(`[cancel-unpaid-etransfer] status=${res.status} cancelled=${data.cancelled ?? "?"} code=${data.code ?? "-"}`);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("[cancel-unpaid-etransfer] request failed:", error instanceof Error ? error.name : "unknown");
    return new Response("error", { status: 200 });
  }
}

export const config = { schedule: "@hourly" };
