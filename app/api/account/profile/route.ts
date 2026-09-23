import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/require-session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";

const UNAVAILABLE_MESSAGE = "Your account details aren't available yet — this is being connected to WooCommerce. Please call (778) 278-7727 for help.";

export async function GET() {
  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const result = await getCustomerProfile(guard.session.sub);
  if (result.ok) return NextResponse.json({ profile: result.data });

  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
  }
  if (result.reason === "not_found") {
    return NextResponse.json({ error: "We couldn't find your account details." }, { status: 404 });
  }
  return NextResponse.json({ error: "We couldn't load your account details right now. Please try again shortly." }, { status: 502 });
}
