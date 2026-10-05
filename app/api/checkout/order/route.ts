import { NextResponse } from "next/server";
import { forbiddenOriginResponse, requireSession, tooManyRequestsResponse } from "@/lib/server/require-session";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { placeOrder, verifyLinesAreInCatalogue } from "@/lib/server/checkout";
import {
  parseCanadianAddress,
  parseCheckoutLines,
  parseCouponCode,
  parseCustomerNote,
  parseIdempotencyKey,
  parseShippingMethodId,
} from "@/lib/checkout/validation";

const NO_STORE = { "Cache-Control": "private, no-store" };
const SUPPORTED_PAYMENT_METHODS = new Set(["nag_etransfer"]);

/**
 * Creates a real WooCommerce order. WooCommerce re-reads every product's
 * current price/stock/variation, applies the coupon, computes shipping and
 * tax, and reduces stock through its own on-hold workflow — inside one
 * WordPress request guarded by the idempotency key (repeat clicks and
 * network retries return the original order instead of a second one).
 */
export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  // Only verified + approved accounts (or grandfathered existing customers,
  // per the WordPress setting) may order. Enforced again in WordPress.
  if (!guard.session.status.canCheckout) {
    return NextResponse.json({ error: "Your account isn't approved for online ordering yet.", accountNotReady: true }, { status: 403 });
  }

  const limit = checkRateLimit(`order:${guard.session.sub}`, 10, 10 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const idempotencyKey = parseIdempotencyKey(body.idempotencyKey);
  if (!idempotencyKey) return NextResponse.json({ error: "Invalid request. Please refresh the page and try again." }, { status: 400 });

  const lines = parseCheckoutLines(body.lines);
  if (!lines.ok) return NextResponse.json({ error: lines.error }, { status: 400 });

  const coupon = parseCouponCode(body.coupon);
  if (!coupon.ok) return NextResponse.json({ error: coupon.error, fieldErrors: { coupon: coupon.error } }, { status: 400 });

  const shippingMethod = parseShippingMethodId(body.shippingMethod);
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
  const expectedTotal = typeof body.expectedTotal === "string" && /^\d{1,7}(\.\d{1,2})?$/.test(body.expectedTotal) ? body.expectedTotal : "";
  const shipToDifferentAddress = body.shipToDifferentAddress === true;

  const fieldErrors: Record<string, string> = {};
  const billing = parseCanadianAddress(body.billing, "billing", fieldErrors, { phoneRequired: true });
  const shipping = shipToDifferentAddress ? parseCanadianAddress(body.shipping, "shipping", fieldErrors) : billing;
  if (!shippingMethod) fieldErrors.shippingMethod = "Choose a delivery option.";
  if (!SUPPORTED_PAYMENT_METHODS.has(paymentMethod)) fieldErrors.paymentMethod = "Choose a payment method.";
  if (body.agreedToTerms !== true) fieldErrors.agreedToTerms = "Please agree to the Terms and Conditions and Privacy Policy.";
  if (!expectedTotal) fieldErrors.total = "Please review your order total.";

  if (!billing || !shipping || Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const catalogue = await verifyLinesAreInCatalogue(lines.lines);
  if (!catalogue.ok) {
    if ("unavailable" in catalogue) return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again shortly." }, { status: 503 });
    return NextResponse.json({ error: catalogue.error, unavailableProductIds: catalogue.unavailableProductIds }, { status: 409 });
  }

  const result = await placeOrder(guard.session.sub, {
    lines: lines.lines,
    coupon: coupon.code,
    shippingMethod,
    billing,
    shipping,
    shipToDifferentAddress,
    idempotencyKey,
    customerNote: parseCustomerNote(body.customerNote),
    paymentMethod: "nag_etransfer",
    expectedTotal,
    termsAcceptedAt: new Date().toISOString(),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, order: result.data }, { headers: NO_STORE });
  }
  if (result.reason === "rejected") {
    // e.g. nag_total_changed, nag_stock, nag_coupon_invalid, nag_order_in_progress, nag_account_not_ready
    const status = result.code === "nag_order_in_progress" ? 409 : result.status >= 500 ? 502 : result.status === 403 ? 403 : 409;
    return NextResponse.json({ error: result.message, code: result.code, details: result.details }, { status });
  }
  // Ambiguous failure (timeout/network): the order may or may not exist.
  // The client keeps the same idempotency key, so retrying is safe.
  return NextResponse.json(
    { error: "We couldn't confirm your order. Please try again — retrying won't create a duplicate order.", retryable: true },
    { status: 503 }
  );
}
