import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/server/wp-auth";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";

const INVALID_LINK = "This verification link is invalid or has expired. Log in to request a new one.";

/** POST (not GET) so link scanners in email clients can't consume the token just by prefetching the page. The page at /account/verify-email submits this when the customer clicks the button. */
export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const limit = checkRateLimit(`verify:ip:${getClientIp(request)}`, 20, 15 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => ({}))) as { uid?: unknown; token?: unknown };
  const uid = typeof body.uid === "string" ? body.uid : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^[1-9]\d{0,11}$/.test(uid) || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  }

  const outcome = await verifyEmailToken(uid, token);
  if (outcome.ok) return NextResponse.json({ ok: true });
  if (outcome.reason === "service_unavailable") {
    return NextResponse.json({ error: "We couldn't verify your email right now. Please try again shortly.", unavailable: true }, { status: 503 });
  }
  if (outcome.reason === "rate_limited") return tooManyRequestsResponse();
  return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
}
