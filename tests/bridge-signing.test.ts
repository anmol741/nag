import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { bridgeUrl, canonicalString, signBridgeRequest } from "../lib/security/bridge-signing";

// Fixed test vector. The WordPress plugin (class-nag-bridge-auth.php) must
// produce the same signature for the same inputs — see the plugin README's
// "Verifying the signature" section, which repeats these exact values so it
// can be checked with `wp eval` on a staging site.
const SECRET = "test-secret-0123456789abcdef0123456789abcdef";
const BODY = '{"email":"a@b.co"}';
const NOW = 1_760_000_000_000; // ms
const NONCE = "0123456789abcdef0123456789abcdef";

test("canonical string matches the documented format", () => {
  const bodyHash = createHash("sha256").update(BODY).digest("hex");
  assert.equal(canonicalString("1760000000", NONCE, "post", "/auth/login", BODY), `v1\n1760000000\n${NONCE}\nPOST\n/auth/login\n${bodyHash}`);
});

test("signature is a hex HMAC-SHA256 of the canonical string", () => {
  const headers = signBridgeRequest(SECRET, "POST", "/auth/login", BODY, NOW, NONCE);
  const expected = createHmac("sha256", SECRET).update(canonicalString("1760000000", NONCE, "POST", "/auth/login", BODY)).digest("hex");
  assert.equal(headers["X-Nag-Timestamp"], "1760000000");
  assert.equal(headers["X-Nag-Nonce"], NONCE);
  assert.equal(headers["X-Nag-Signature"], expected);
  assert.match(headers["X-Nag-Signature"], /^[a-f0-9]{64}$/);
});

test("any change to body, route or method changes the signature", () => {
  const base = signBridgeRequest(SECRET, "POST", "/auth/login", BODY, NOW, NONCE)["X-Nag-Signature"];
  assert.notEqual(signBridgeRequest(SECRET, "POST", "/auth/login", '{"email":"x@b.co"}', NOW, NONCE)["X-Nag-Signature"], base);
  assert.notEqual(signBridgeRequest(SECRET, "POST", "/auth/register", BODY, NOW, NONCE)["X-Nag-Signature"], base);
  assert.notEqual(signBridgeRequest(SECRET, "GET", "/auth/login", BODY, NOW, NONCE)["X-Nag-Signature"], base);
  assert.notEqual(signBridgeRequest(`${SECRET}x`, "POST", "/auth/login", BODY, NOW, NONCE)["X-Nag-Signature"], base);
});

test("random nonces are 32 hex chars (what the plugin accepts)", () => {
  assert.match(signBridgeRequest(SECRET, "POST", "/x", "{}")["X-Nag-Nonce"], /^[a-f0-9]{32}$/);
});

test("bridge URL uses the store's ?rest_route= style", () => {
  assert.equal(bridgeUrl("https://nagsbeautysupply.com/", "/auth/login"), "https://nagsbeautysupply.com/?rest_route=%2Fnag-bridge%2Fv1%2Fauth%2Flogin");
});

test("published test vector (for verifying the PHP side)", () => {
  const sig = signBridgeRequest(SECRET, "POST", "/auth/login", BODY, NOW, NONCE)["X-Nag-Signature"];
  // Printed so it can be pasted into the plugin README check.
  console.log(`test-vector signature: ${sig}`);
  assert.equal(sig.length, 64);
});
