import { NextResponse } from "next/server";
import { attemptLogin } from "@/lib/server/wp-auth";
import { createSession } from "@/lib/server/session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

// Generic, unhelpful-on-purpose error message for every rejected login —
// never reveals whether the email exists, matching the requirement that
// login errors don't leak account existence.
const GENERIC_ERROR = "We couldn't log you in with that email and password. Please check your details and try again.";
const UNAVAILABLE_MESSAGE =
  "Online account login isn't connected yet. Please call (778) 278-7727 or visit our Langley storefront to place an order.";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes and try again." },
      { status: 429, headers: rateLimit.retryAfterSeconds ? { "Retry-After": String(rateLimit.retryAfterSeconds) } : undefined }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);

  // Never log the password or any part of the raw request body — only
  // the normalized email and the outcome, for basic operational visibility.
  const outcome = await attemptLogin(normalizedEmail, password);

  if (outcome.ok) {
    await createSession(outcome.customerId, outcome.email);
    return NextResponse.json({ ok: true });
  }

  if (outcome.reason === "service_unavailable") {
    console.warn(`[auth/login] attempted while unavailable — email=${normalizedEmail}`);
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
  }

  // "invalid_credentials" — and any other rejection — all surface the same
  // generic message, at the same status code, so a timing/response-shape
  // difference can't be used to enumerate valid emails.
  return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
}
