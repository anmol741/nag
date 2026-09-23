import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";

/** Shared guard for account API routes: returns the verified session, or a 401 response to return as-is. The customer ID always comes from here — never from the request body/query/params. */
export async function requireSession(): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Please log in to continue.", loggedOut: true }, { status: 401 }) };
  }
  return { session };
}
