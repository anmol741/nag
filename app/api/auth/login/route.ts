import { NextResponse } from "next/server";
import { attemptLogin } from "@/lib/server/wp-auth";
import { createSession } from "@/lib/server/session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import { business } from "@/lib/site-config";

// One generic message for every rejected login — never reveals whether the
// email exists.
const GENERIC_ERROR = "We couldn't log you in with that email and password. Please check your details and try again.";
const UNAVAILABLE_MESSAGE = `Online account login is temporarily unavailable. Please try again shortly, or call ${business.phone}.`;

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 15 * 60);
  if (!ipLimit.allowed) return tooManyRequestsResponse(ipLimit.retryAfterSeconds, "Too many login attempts. Please wait a few minutes and try again.");

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
  if (!isValidEmail(email) || password.length > 200) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Without a session secret no cookie can be issued — don't verify a
  // password we can't then log the customer in with.
  if (!process.env.SESSION_SECRET) {
    console.error("[auth/login] SESSION_SECRET is not set");
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
  }

  const normalizedEmail = normalizeEmail(email);
  const emailLimit = checkRateLimit(`login:email:${normalizedEmail}`, 5, 15 * 60);
  if (!emailLimit.allowed) return tooManyRequestsResponse(emailLimit.retryAfterSeconds, "Too many login attempts. Please wait a few minutes and try again.");

  // Never log the password or the raw body.
  const outcome = await attemptLogin(normalizedEmail, password, ip);

  if (outcome.ok) {
    await createSession(outcome.customerId, outcome.email, outcome.sessionToken);
    return NextResponse.json({ ok: true, status: outcome.status });
  }

  switch (outcome.reason) {
    case "service_unavailable":
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
    case "rate_limited":
      return tooManyRequestsResponse(undefined, "Too many login attempts. Please wait a few minutes and try again.");
    case "account_rejected":
      // Only reachable after WordPress verified the correct password, so
      // this doesn't disclose anything to someone who doesn't own the account.
      return NextResponse.json(
        { error: `Your account application wasn't approved. Please contact us at ${business.phone} if you have questions.` },
        { status: 403 }
      );
    default:
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
}
