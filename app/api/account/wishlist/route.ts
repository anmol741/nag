import { NextResponse } from "next/server";
import { forbiddenOriginResponse, requireSession, tooManyRequestsResponse } from "@/lib/server/require-session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { bridgeRequest } from "@/lib/server/bridge";

// The account wishlist. The customer ID always comes from the verified
// session — there is no way to address another customer's wishlist.

const MAX_ITEMS = 200;
const NO_STORE = { "Cache-Control": "private, no-store" };

function parseIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_ITEMS) return null;
  const ids: string[] = [];
  for (const value of raw) {
    const id = String(value);
    if (!/^[1-9]\d{0,11}$/.test(id)) return null;
    ids.push(id);
  }
  return [...new Set(ids)];
}

function unavailable() {
  return NextResponse.json({ error: "Your wishlist can't be synced right now." }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const result = await bridgeRequest<{ ids: string[] }>("/wishlist/get", { userId: guard.session.sub });
  if (!result.ok) return unavailable();
  return NextResponse.json({ ids: result.data.ids }, { headers: NO_STORE });
}

async function write(request: Request, mode: "merge" | "set") {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();
  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const limit = checkRateLimit(`wishlist:${guard.session.sub}`, 60, 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = parseIds(body.ids);
  if (!ids) return NextResponse.json({ error: "Invalid wishlist." }, { status: 400 });

  const result = await bridgeRequest<{ ids: string[] }>(mode === "merge" ? "/wishlist/merge" : "/wishlist/set", { userId: guard.session.sub, ids });
  if (!result.ok) return unavailable();
  return NextResponse.json({ ids: result.data.ids }, { headers: NO_STORE });
}

/** Merge the guest wishlist into the account (first sync after login). */
export async function POST(request: Request) {
  return write(request, "merge");
}

/** Replace the account wishlist (subsequent changes). */
export async function PUT(request: Request) {
  return write(request, "set");
}
