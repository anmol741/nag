import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

/**
 * Minimal, PII-free session check — returns only whether the visitor is
 * logged in, nothing else (no email, no customer ID). Header calls this
 * client-side after mount to decide which account icon/menu to show,
 * rather than the session ever being baked into statically-generated,
 * CDN-cacheable page HTML — see app/layout.tsx's comment for why.
 *
 * `Cache-Control: private, no-store` — this response is per-visitor and
 * must never be cached or shared.
 */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ loggedIn: Boolean(session) }, { headers: { "Cache-Control": "private, no-store" } });
}
