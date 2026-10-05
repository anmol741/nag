// Integration tests: the real Next.js route handlers, with the WordPress
// bridge replaced by a fetch mock. Covers the request flow end to end on
// the Next.js side (origin check → rate limit → validation → signed bridge
// call → response mapping). Routes that need a live session cookie
// (cookies() from next/headers) are only tested up to their pre-session
// guards here.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";

const SITE = "https://taupe-buttercream-c55e75.netlify.app";
const BRANCH = "https://main--taupe-buttercream-c55e75.netlify.app";
const SECRET = "integration-test-secret-0123456789abcdef0123456789";

process.env.NEXT_PUBLIC_SITE_URL = SITE;
process.env.WORDPRESS_BRIDGE_SECRET = SECRET;
process.env.WORDPRESS_BRIDGE_URL = "https://wp.example.test";
process.env.SESSION_SECRET = "integration-test-session-secret-0123456789abcdef";

interface BridgeCall {
  route: string;
  body: Record<string, unknown>;
  headers: Headers;
}
let calls: BridgeCall[] = [];
let respond: (route: string, body: Record<string, unknown>) => Response = () => Response.json({ ok: true });

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== "wp.example.test") return realFetch(input, init);
  const route = (url.searchParams.get("rest_route") ?? "").replace("/nag-bridge/v1", "");
  const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
  calls.push({ route, body, headers: new Headers(init?.headers) });
  return respond(route, body);
}) as typeof fetch;

const { POST: register } = await import("../app/api/auth/register/route");
const { POST: login } = await import("../app/api/auth/login/route");
const { POST: forgot } = await import("../app/api/auth/forgot-password/route");
const { POST: placeOrder } = await import("../app/api/checkout/order/route");

let ipCounter = 0;
function headers(origin: string | null, extra: Record<string, string> = {}) {
  const h: Record<string, string> = { "x-nf-client-connection-ip": `203.0.113.${++ipCounter}`, ...extra };
  if (origin) h.origin = origin;
  return h;
}

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46]);

function registrationForm(overrides: Record<string, string> = {}, file: File | null = new File([PDF_BYTES], "license.pdf", { type: "application/pdf" })) {
  const form = new FormData();
  const fields = {
    firstName: "Jane",
    lastName: "Doe",
    email: "Jane.Doe@Example.com",
    phone: "778-278-7727",
    salonName: "Glow Spa",
    password: "secret123",
    confirmPassword: "secret123",
    agreedToTerms: "true",
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append("certification", file);
  return form;
}

beforeEach(() => {
  calls = [];
  respond = () => Response.json({ ok: true });
});

test("register: rejects a foreign origin before doing anything", async () => {
  const res = await register(new Request(`${SITE}/api/auth/register`, { method: "POST", headers: headers("https://evil.example"), body: registrationForm() }));
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test("register: accepted from the Netlify branch URL (the live 403 bug) and forwarded signed", async () => {
  const res = await register(new Request(`${SITE}/api/auth/register`, { method: "POST", headers: headers(BRANCH), body: registrationForm() }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(call.route, "/auth/register");
  assert.equal(call.body.email, "jane.doe@example.com");
  assert.equal(call.body.phone, "(778) 278-7727");
  assert.equal("confirmPassword" in call.body, false);
  const cert = call.body.certification as Record<string, string>;
  assert.equal(cert.mimeType, "application/pdf");
  assert.equal(Buffer.from(cert.base64, "base64").length, PDF_BYTES.length);

  // Signature verifies with the shared secret, exactly as the plugin checks it.
  const ts = call.headers.get("x-nag-timestamp")!;
  const nonce = call.headers.get("x-nag-nonce")!;
  const rawBody = JSON.stringify(call.body);
  const canonical = ["v1", ts, nonce, "POST", "/auth/register", createHash("sha256").update(rawBody).digest("hex")].join("\n");
  assert.equal(call.headers.get("x-nag-signature"), createHmac("sha256", SECRET).update(canonical).digest("hex"));
});

test("register: invalid fields and missing certification are rejected server-side", async () => {
  const res = await register(
    new Request(`${SITE}/api/auth/register`, {
      method: "POST",
      headers: headers(SITE),
      body: registrationForm({ email: "nope", phone: "123", password: "short", confirmPassword: "different", agreedToTerms: "false" }, null),
    })
  );
  assert.equal(res.status, 400);
  const data = (await res.json()) as { fieldErrors: Record<string, string> };
  for (const field of ["email", "phone", "password", "confirmPassword", "agreedToTerms", "certification"]) {
    assert.ok(data.fieldErrors[field], `expected error for ${field}`);
  }
  assert.equal(calls.length, 0);
});

test("register: an HTML file disguised as a PDF never reaches WordPress", async () => {
  const fake = new File(["<html><script>alert(1)</script></html>"], "cert.pdf", { type: "application/pdf" });
  const res = await register(new Request(`${SITE}/api/auth/register`, { method: "POST", headers: headers(SITE), body: registrationForm({}, fake) }));
  assert.equal(res.status, 400);
  assert.ok(((await res.json()) as { fieldErrors: Record<string, string> }).fieldErrors.certification);
  assert.equal(calls.length, 0);
});

test("register: duplicate email maps to 409 with a field error", async () => {
  respond = () => Response.json({ code: "nag_email_exists", message: "exists", data: { status: 409 } }, { status: 409 });
  const res = await register(new Request(`${SITE}/api/auth/register`, { method: "POST", headers: headers(SITE), body: registrationForm() }));
  assert.equal(res.status, 409);
  assert.ok(((await res.json()) as { fieldErrors: Record<string, string> }).fieldErrors.email);
});

test("register: JSON bodies are refused (multipart only)", async () => {
  const res = await register(
    new Request(`${SITE}/api/auth/register`, { method: "POST", headers: { ...headers(SITE), "content-type": "application/json" }, body: "{}" })
  );
  assert.equal(res.status, 415);
});

test("register: WordPress unreachable → 503, not a crash", async () => {
  respond = () => {
    throw new TypeError("fetch failed");
  };
  const res = await register(new Request(`${SITE}/api/auth/register`, { method: "POST", headers: headers(SITE), body: registrationForm() }));
  assert.equal(res.status, 503);
});

test("login: wrong password and unknown email get the identical generic response", async () => {
  respond = () => Response.json({ code: "nag_invalid_credentials", message: "x", data: { status: 401 } }, { status: 401 });
  const a = await login(new Request(`${SITE}/api/auth/login`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "known@example.com", password: "wrong1234" }) }));
  const b = await login(new Request(`${SITE}/api/auth/login`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "unknown@example.com", password: "wrong1234" }) }));
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.deepEqual(await a.json(), await b.json());
});

test("login: per-email rate limit kicks in after 5 attempts", async () => {
  respond = () => Response.json({ code: "nag_invalid_credentials", message: "x", data: { status: 401 } }, { status: 401 });
  let last = 0;
  for (let i = 0; i < 6; i++) {
    const res = await login(new Request(`${SITE}/api/auth/login`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "victim@example.com", password: "guess1234" }) }));
    last = res.status;
  }
  assert.equal(last, 429);
});

test("login: a misconfigured bridge secret surfaces as unavailable, not 'wrong password'", async () => {
  respond = () => Response.json({ code: "bridge_unauthorized", message: "Unauthorized.", data: { status: 401 } }, { status: 401 });
  const res = await login(new Request(`${SITE}/api/auth/login`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "a@example.com", password: "secret123" }) }));
  assert.equal(res.status, 503);
});

test("login: without SESSION_SECRET the password is never sent to WordPress", async () => {
  const saved = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  try {
    const res = await login(new Request(`${SITE}/api/auth/login`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "a@example.com", password: "secret123" }) }));
    assert.equal(res.status, 503);
    assert.equal(calls.length, 0);
  } finally {
    process.env.SESSION_SECRET = saved;
  }
});

test("forgot password: same response whether or not the account exists", async () => {
  const res = await forgot(new Request(`${SITE}/api/auth/forgot-password`, { method: "POST", headers: headers(SITE), body: JSON.stringify({ email: "anyone@example.com" }) }));
  assert.equal(res.status, 200);
  const data = (await res.json()) as { message: string };
  assert.match(data.message, /If an account exists/);
  assert.equal(calls[0].route, "/auth/password/forgot");
});

test("checkout order: cross-site request is refused before any session or order work", async () => {
  const res = await placeOrder(
    new Request(`${SITE}/api/checkout/order`, { method: "POST", headers: headers("https://evil.example", { "sec-fetch-site": "cross-site" }), body: "{}" })
  );
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});
