import "server-only";
import { bridgeRequest, type BridgeResult } from "./bridge";
import { getProductsByIds, WooCommerceApiError } from "@/lib/woocommerce";
import type { CheckoutAddress, CheckoutLineInput, QuoteDestination } from "@/lib/checkout/validation";
import type { CheckoutQuote } from "@/lib/checkout/types";

// Server-side checkout orchestration. This module never computes a price,
// discount, tax, shipping cost or stock level itself — WooCommerce does,
// inside WordPress, through its own cart and checkout classes (see the
// bridge plugin's class-nag-checkout.php). What this module adds is a
// catalogue pre-check against the public Store API, so products hidden
// from this storefront (unpublished, or GlyMed — see lib/woocommerce.ts)
// can't be ordered by crafting a request.

export interface QuoteRequest {
  lines: CheckoutLineInput[];
  coupon: string;
  shippingMethod: string | null;
  /** null = address not complete yet; WooCommerce prices without shipping. */
  destination: QuoteDestination | null;
}

export interface CheckoutRequest {
  lines: CheckoutLineInput[];
  coupon: string;
  shippingMethod: string | null;
  billing: CheckoutAddress;
  shipping: CheckoutAddress;
  shipToDifferentAddress: boolean;
}

export type CatalogueCheck = { ok: true } | { ok: false; error: string; unavailableProductIds?: string[] } | { ok: false; unavailable: true };

/** Every requested product must still be visible in this storefront's catalogue (published, not hidden, not GlyMed). */
export async function verifyLinesAreInCatalogue(lines: CheckoutLineInput[]): Promise<CatalogueCheck> {
  const ids = [...new Set(lines.map((l) => l.productId))];
  let visible: Set<string>;
  try {
    const products = await getProductsByIds(ids);
    visible = new Set(products.map((p) => p.id));
  } catch (error) {
    if (error instanceof WooCommerceApiError) return { ok: false, unavailable: true };
    throw error;
  }
  const missing = ids.filter((id) => !visible.has(id));
  if (missing.length > 0) {
    return { ok: false, error: "Some items in your cart are no longer available. Please remove them and try again.", unavailableProductIds: missing };
  }
  return { ok: true };
}

function toBridgePayload(customerId: string, req: CheckoutRequest) {
  return {
    userId: customerId,
    lines: req.lines,
    coupon: req.coupon,
    shippingMethod: req.shippingMethod,
    billing: req.billing,
    shipping: req.shipToDifferentAddress ? req.shipping : req.billing,
    shipToDifferentAddress: req.shipToDifferentAddress,
  };
}

export async function quoteCheckout(customerId: string, req: QuoteRequest): Promise<BridgeResult<CheckoutQuote>> {
  return bridgeRequest<CheckoutQuote>("/checkout/quote", {
    userId: customerId,
    lines: req.lines,
    coupon: req.coupon,
    shippingMethod: req.shippingMethod,
    destination: req.destination,
  });
}

export interface PlaceOrderRequest extends CheckoutRequest {
  idempotencyKey: string;
  customerNote: string;
  paymentMethod: "nag_etransfer";
  /** The total the customer saw. Not used for pricing — if WooCommerce's own total differs, the order is refused so the customer can review the new amount. */
  expectedTotal: string;
  termsAcceptedAt: string;
}

export interface PlacedOrder {
  orderId: number;
  orderNumber: string;
  total: string;
  status: string;
  /** True when this idempotency key had already produced an order (a retried/double-clicked submit) — the original order is returned, no new one is created. */
  duplicate: boolean;
}

export async function placeOrder(customerId: string, req: PlaceOrderRequest): Promise<BridgeResult<PlacedOrder>> {
  return bridgeRequest<PlacedOrder>(
    "/checkout/order",
    {
      ...toBridgePayload(customerId, req),
      idempotencyKey: req.idempotencyKey,
      customerNote: req.customerNote,
      paymentMethod: req.paymentMethod,
      expectedTotal: req.expectedTotal,
      termsAcceptedAt: req.termsAcceptedAt,
    },
    { timeoutMs: 45_000 }
  );
}
