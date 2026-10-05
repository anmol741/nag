import type { Metadata } from "next";
import { getVerifiedSession } from "@/lib/server/session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";
import CheckoutPageClient, { type CheckoutProfile } from "./CheckoutPageClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
// Reflects the visitor's own session — never prerendered.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Cart contents only exist client-side (localStorage — see lib/cart.ts),
  // so whether to redirect a logged-out visitor is decided in
  // CheckoutPageClient once the cart is known (an empty cart shows the
  // empty state either way). What's resolved here: whether the session is
  // valid in WordPress, the account's checkout eligibility, and the saved
  // profile for prefilling.
  const sessionResult = await getVerifiedSession();
  const session = sessionResult.state === "valid" ? sessionResult.session : null;
  const profileResult = session ? await getCustomerProfile(session.sub) : null;

  let profile: CheckoutProfile | null = null;
  if (session && profileResult?.ok) {
    const p = profileResult.data;
    profile = {
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      salonName: p.salonName,
      billing: p.billing,
      shipping: p.shipping,
    };
  }

  return (
    <CheckoutPageClient
      loggedIn={Boolean(session)}
      serviceUnavailable={sessionResult.state === "unavailable"}
      accountStatus={session?.status ?? null}
      profile={profile}
      sessionEmail={session?.email ?? ""}
    />
  );
}
