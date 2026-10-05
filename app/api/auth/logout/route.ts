import { NextResponse } from "next/server";
import { clearSession, forgetVerifiedSession, getSession } from "@/lib/server/session";
import { revokeSessionToken } from "@/lib/server/wp-auth";
import { verifySameOrigin } from "@/lib/server/csrf";
import { forbiddenOriginResponse } from "@/lib/server/require-session";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const session = await getSession();
  if (session) {
    forgetVerifiedSession(session);
    // Destroys the WordPress session token, so a copy of this cookie stops
    // working everywhere — not just in this browser.
    await revokeSessionToken(session.sub, session.sid).catch(() => undefined);
  }
  await clearSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
