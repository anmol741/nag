import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/server/wp-auth";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

const GENERIC_OK = "If an account exists for that email, we've sent a password reset link. Please check your inbox and spam folder.";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const limit = checkRateLimit(`forgot:ip:${ip}`, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const normalized = normalizeEmail(email);
  const emailLimit = checkRateLimit(`forgot:email:${normalized}`, 3, 60 * 60);
  // Same success message when limited — a different response would reveal the address was used.
  if (!emailLimit.allowed) return NextResponse.json({ ok: true, message: GENERIC_OK });

  const outcome = await requestPasswordReset(normalized, ip);
  if (!outcome.ok && outcome.reason === "service_unavailable") {
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again shortly.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
