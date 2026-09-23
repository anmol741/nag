import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";
import { isSafeReturnPath } from "@/lib/validation";

// Server-side route protection for account pages that have no logged-out
// state of their own (orders, addresses, details — as opposed to /account
// itself, which shows a login form when logged out, and /checkout, whose
// protection depends on cart contents that only exist client-side in
// localStorage, so it's handled in CheckoutPageClient instead — see that
// file's comment for why Proxy can't do it there).
//
// Runs on the Node.js runtime (Next.js 16 default for Proxy), so it can
// use the same signed-cookie session verification as the Route Handlers
// (lib/server/session.ts uses node:crypto, not Edge-compatible Web Crypto).

const PROTECTED_PREFIXES = ["/account/orders", "/account/addresses", "/account/details"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) return NextResponse.next();

  const session = await getSession();
  if (session) return NextResponse.next();

  const returnTo = isSafeReturnPath(pathname) ? pathname : "/account";
  const loginUrl = new URL("/account", request.url);
  loginUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/orders/:path*", "/account/addresses", "/account/details"],
};
