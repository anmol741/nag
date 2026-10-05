// Request signing for server-to-server calls from this app to the
// WordPress "Nag's Headless Bridge" plugin (wordpress/nags-headless-bridge).
// Pure node:crypto, no Next.js imports, so it's shared by the Next.js
// server (lib/server/bridge.ts), the Netlify scheduled function
// (netlify/functions/), and the unit tests.
//
// The plugin recomputes the exact same canonical string and compares with
// hash_equals(). The secret never leaves either server.
//
// Canonical string (newline-separated):
//   v1
//   <unix timestamp seconds>
//   <random nonce>
//   <HTTP method, upper case>
//   <route, e.g. /auth/login>
//   <hex sha256 of the raw request body>

import { createHash, createHmac, randomBytes } from "node:crypto";

export const BRIDGE_NAMESPACE = "/nag-bridge/v1";

export interface SignedHeaders {
  "X-Nag-Timestamp": string;
  "X-Nag-Nonce": string;
  "X-Nag-Signature": string;
}

export function canonicalString(timestamp: string, nonce: string, method: string, route: string, body: string): string {
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  return ["v1", timestamp, nonce, method.toUpperCase(), route, bodyHash].join("\n");
}

export function signBridgeRequest(
  secret: string,
  method: string,
  route: string,
  body: string,
  now: number = Date.now(),
  nonce: string = randomBytes(16).toString("hex")
): SignedHeaders {
  const timestamp = String(Math.floor(now / 1000));
  const signature = createHmac("sha256", secret).update(canonicalString(timestamp, nonce, method, route, body)).digest("hex");
  return { "X-Nag-Timestamp": timestamp, "X-Nag-Nonce": nonce, "X-Nag-Signature": signature };
}

/** Builds the bridge URL in this store's query-string REST style (`/?rest_route=...`), matching lib/woocommerce.ts. */
export function bridgeUrl(baseUrl: string, route: string): string {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/`);
  url.searchParams.set("rest_route", `${BRIDGE_NAMESPACE}${route}`);
  return url.toString();
}
