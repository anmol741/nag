import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/server/wp-auth";
import { clearSession } from "@/lib/server/session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { isValidPassword } from "@/lib/validation";

const INVALID_LINK = "This password reset link is invalid or has expired. Please request a new one.";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const limit = checkRateLimit(`reset:ip:${ip}`, 10, 60 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => ({}))) as { login?: unknown; key?: unknown; password?: unknown; confirmPassword?: unknown };
  const login = typeof body.login === "string" ? body.login.trim().slice(0, 254) : "";
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!login || !/^[A-Za-z0-9]{10,64}$/.test(key)) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });

  const fieldErrors: Record<string, string> = {};
  if (!isValidPassword(password) || password.length > 200) fieldErrors.password = "Password must be 8–200 characters and include a letter and a number.";
  if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const outcome = await resetPassword(login, key, password, ip);
  if (outcome.ok) {
    // WordPress destroyed every existing session for this account; drop
    // this browser's cookie too so the customer logs in fresh.
    await clearSession();
    return NextResponse.json({ ok: true });
  }
  if (outcome.reason === "service_unavailable") {
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again shortly.", unavailable: true }, { status: 503 });
  }
  if (outcome.reason === "rate_limited") return tooManyRequestsResponse();
  return NextResponse.json({ error: outcome.message || INVALID_LINK }, { status: 400 });
}
