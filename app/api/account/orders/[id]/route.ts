import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/require-session";
import { getCustomerOrder } from "@/lib/server/woocommerce-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  // getCustomerOrder verifies the order's customer_id matches the
  // session's customer ID before ever returning it — a mismatched or
  // nonexistent order both come back as the same "not_found", so this
  // never confirms or denies that a *different* order ID exists.
  const result = await getCustomerOrder(guard.session.sub, id);
  if (result.ok) return NextResponse.json({ order: result.data });

  if (result.reason === "not_found") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: "Order details aren't connected yet. Please call (778) 278-7727.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ error: "We couldn't load this order right now. Please try again shortly." }, { status: 502 });
}
