import "server-only";
import { NextResponse } from "next/server";
import { clearSession, getVerifiedSession, type VerifiedSession } from "./session";

/**
 * Shared guard for account/checkout API routes: returns the verified
 * session (signature, expiry AND live WordPress session token), or a
 * response to return as-is. The customer ID always comes from here — never
 * from the request body/query/params.
 */
export async function requireSession(): Promise<{ session: VerifiedSession } | { response: NextResponse }> {
  const result = await getVerifiedSession();
  if (result.state === "valid") return { session: result.session };

  if (result.state === "unavailable") {
    return {
      response: NextResponse.json(
        { error: "Your account can't be reached right now. Please try again in a few minutes.", unavailable: true },
        { status: 503 }
      ),
    };
  }

  // Revoked or invalid: also drop the stale cookie.
  await clearSession();
  return { response: NextResponse.json({ error: "Please log in to continue.", loggedOut: true }, { status: 401 }) };
}

/** Standard JSON error for a request that failed the same-origin check. */
export function forbiddenOriginResponse(): NextResponse {
  return NextResponse.json({ error: "This request couldn't be verified. Please refresh the page and try again." }, { status: 403 });
}

/** Standard 429 with Retry-After. */
export function tooManyRequestsResponse(retryAfterSeconds?: number, message = "Too many attempts. Please wait a few minutes and try again."): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined }
  );
}
