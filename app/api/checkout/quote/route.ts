import { NextResponse } from "next/server";
import { forbiddenOriginResponse, requireSession, tooManyRequestsResponse } from "@/lib/server/require-session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { quoteCheckout, verifyLinesAreInCatalogue } from "@/lib/server/checkout";
import { parseCheckoutLines, parseCouponCode, parseQuoteDestination, parseShippingMethodId } from "@/lib/checkout/validation";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Prices the cart through WooCommerce: real current prices, stock,
 * variations, coupon, Canadian shipping rates (incl. local pickup) and tax.
 * Only IDs, quantities, coupon code, chosen rate and destination are read
 * from the request — never an amount.
 */
export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  const limit = checkRateLimit(`quote:${guard.session.sub}`, 60, 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const lines = parseCheckoutLines(body.lines);
  if (!lines.ok) return NextResponse.json({ error: lines.error }, { status: 400 });
  const coupon = parseCouponCode(body.coupon);
  if (!coupon.ok) return NextResponse.json({ error: coupon.error, fieldErrors: { coupon: coupon.error } }, { status: 400 });
  const destination = parseQuoteDestination(body.destination);
  if (!destination.ok) return NextResponse.json({ error: destination.error }, { status: 400 });

  const catalogue = await verifyLinesAreInCatalogue(lines.lines);
  if (!catalogue.ok) {
    if ("unavailable" in catalogue) return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again shortly." }, { status: 503 });
    return NextResponse.json({ error: catalogue.error, unavailableProductIds: catalogue.unavailableProductIds }, { status: 409 });
  }

  const result = await quoteCheckout(guard.session.sub, {
    lines: lines.lines,
    coupon: coupon.code,
    shippingMethod: parseShippingMethodId(body.shippingMethod),
    destination: destination.destination,
  });

  if (result.ok) return NextResponse.json({ quote: result.data }, { headers: NO_STORE });
  if (result.reason === "rejected") return NextResponse.json({ error: result.message, code: result.code }, { status: result.status >= 500 ? 502 : 400 });
  return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again shortly.", unavailable: true }, { status: 503 });
}
