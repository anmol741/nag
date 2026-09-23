import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/require-session";
import { getCustomerOrders } from "@/lib/server/woocommerce-admin";

export async function GET() {
  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const result = await getCustomerOrders(guard.session.sub);
  if (result.ok) return NextResponse.json({ orders: result.data });

  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: "Order history isn't connected yet. Please call (778) 278-7727.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ error: "We couldn't load your order history right now. Please try again shortly." }, { status: 502 });
}
