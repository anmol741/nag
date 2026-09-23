import type { Metadata } from "next";
import { getSession } from "@/lib/server/session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = { title: "Checkout" };
// Reflects the visitor's own session (for prefill) — see
// app/account/page.tsx's comment for why this must be forced rather than
// left to automatic dynamic-API detection.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Cart contents only exist client-side (localStorage — see lib/cart.ts),
  // so whether to redirect a logged-out visitor can't be decided here or
  // in proxy.ts: an empty cart must still show the empty-cart state even
  // when logged out. CheckoutPageClient makes that call once it knows the
  // cart. What CAN be resolved server-side is passed down as plain props
  // so there's no client-side session fetch/flash: whether the visitor is
  // logged in, and — if so — their profile, for prefilling the form.
  const session = await getSession();
  const profileResult = session ? await getCustomerProfile(session.sub) : null;

  return (
    <CheckoutPageClient
      loggedIn={Boolean(session)}
      profile={profileResult?.ok ? profileResult.data : null}
    />
  );
}
