// Shapes returned by the WordPress bridge's checkout quote. Shared between
// the server routes and the checkout UI. Every amount is a decimal string
// in CAD computed by WooCommerce — the UI displays them, never computes them.

export interface QuoteLine {
  productId: string;
  variationId?: string;
  name: string;
  /** Quantity WooCommerce accepted (may be lower than requested when stock is short). */
  quantity: number;
  requestedQuantity: number;
  unitPrice: string;
  lineSubtotal: string;
  lineTotal: string;
  /** Variation attributes, e.g. ["Size: 50ml"]. */
  options: string[];
}

export type QuoteIssueCode = "out_of_stock" | "insufficient_stock" | "unavailable" | "not_purchasable" | "invalid_variation";

export interface QuoteIssue {
  productId: string;
  variationId?: string;
  code: QuoteIssueCode;
  message: string;
  /** For insufficient_stock: how many can be ordered right now. */
  availableQuantity?: number;
}

export interface ShippingRateOption {
  id: string;
  label: string;
  cost: string;
  isLocalPickup: boolean;
}

export interface CheckoutQuote {
  currency: string;
  lines: QuoteLine[];
  issues: QuoteIssue[];
  coupon: { code: string; applied: boolean; message?: string } | null;
  shippingRates: ShippingRateOption[];
  selectedShippingRate: string | null;
  needsShipping: boolean;
  totals: {
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
    taxLines: { label: string; amount: string }[];
  };
}
