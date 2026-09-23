import { NextResponse } from "next/server";
import { clearSession } from "@/lib/server/session";
import { verifySameOrigin } from "@/lib/server/csrf";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
