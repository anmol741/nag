import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/server/wp-auth";
import { getSession } from "@/lib/server/session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

const GENERIC_OK = "If that account still needs verification, a new link is on its way. Please check your inbox and spam folder.";

/** Uses the logged-in session's email when present, otherwise the submitted one. Same response either way — never discloses whether an account exists. */
export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const limit = checkRateLimit(`resend:ip:${ip}`, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const session = await getSession();
  let email = session?.email ?? "";
  if (!email) {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim() : "";
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const outcome = await resendVerification(normalizeEmail(email), ip);
  if (!outcome.ok && outcome.reason === "service_unavailable") {
    return NextResponse.json({ error: "We couldn't send a new link right now. Please try again shortly.", unavailable: true }, { status: 503 });
  }
  if (!outcome.ok && outcome.reason === "rate_limited") return tooManyRequestsResponse();
  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
