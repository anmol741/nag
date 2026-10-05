import { NextResponse } from "next/server";
import { forbiddenOriginResponse, requireSession } from "@/lib/server/require-session";
import { updateCustomerAddresses } from "@/lib/server/woocommerce-admin";
import { verifySameOrigin } from "@/lib/server/csrf";
import { parseCanadianAddress } from "@/lib/checkout/validation";

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  let body: { billing?: unknown; shipping?: unknown };
  try {
    body = (await request.json()) as { billing?: unknown; shipping?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Shared Canada-only parser (lib/checkout/validation.ts) — the same rules
  // checkout uses, so a saved address is always one checkout will accept.
  const fieldErrors: Record<string, string> = {};
  const billing = parseCanadianAddress(body.billing, "billing", fieldErrors);
  const shipping = parseCanadianAddress(body.shipping ?? body.billing, "shipping", fieldErrors);

  if (!billing || !shipping || Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const result = await updateCustomerAddresses(guard.session.sub, { billing, shipping });

  if (result.ok) return NextResponse.json({ ok: true });
  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: "Address updates aren't available right now. Please call (778) 278-7727.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ error: "We couldn't save your addresses right now. Please try again shortly." }, { status: 502 });
}
