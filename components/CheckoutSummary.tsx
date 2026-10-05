import Image from "next/image";
import type { CartLine } from "@/lib/cart";
import type { CheckoutQuote } from "@/lib/checkout/types";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function money(value: string): string {
  return currency.format(Number.parseFloat(value) || 0);
}

/**
 * Order summary at checkout. Every amount comes from WooCommerce's quote —
 * this component never computes a price, discount, tax or shipping cost.
 * Cart lines are only used for product images.
 */
export default function CheckoutSummary({
  cartLines,
  quote,
  loading,
  error,
}: {
  cartLines: CartLine[];
  quote: CheckoutQuote | null;
  loading: boolean;
  error: string | null;
}) {
  const imageFor = (productId: string, variationId?: string) =>
    cartLines.find((l) => l.productId === productId && l.variationId === variationId)?.image ?? cartLines.find((l) => l.productId === productId)?.image;

  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-6" aria-busy={loading}>
      <h2 className="font-display text-lg text-ink">Your Order</h2>

      {quote ? (
        <ul className="mt-4 divide-y divide-ink/10">
          {quote.lines.map((line) => {
            const image = imageFor(line.productId, line.variationId);
            return (
              <li key={`${line.productId}:${line.variationId ?? ""}`} className="flex items-center gap-3 py-3">
                {image && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-white">
                    <Image src={image.src} alt={image.alt} fill sizes="56px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{line.name}</p>
                  {line.options.length > 0 && <p className="text-xs text-ink/50">{line.options.join(" · ")}</p>}
                  <p className="text-xs text-ink/50">
                    Qty {line.quantity} × {money(line.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink">{money(line.lineSubtotal)}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10">
          {cartLines.map((line) => (
            <li key={`${line.productId}:${line.variationId ?? ""}`} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-white">
                <Image src={line.image.src} alt={line.image.alt} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{line.name}</p>
                <p className="text-xs text-ink/50">Qty {line.quantity}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite">
        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        {!quote && !error && <p className="mt-4 text-sm text-ink/60">Calculating your total…</p>}
      </div>

      {quote && (
        <>
          <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Subtotal</dt>
              <dd className="text-ink">{money(quote.totals.subtotal)}</dd>
            </div>
            {(Number.parseFloat(quote.totals.discount) || 0) > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/60">Discount{quote.coupon?.applied ? ` (${quote.coupon.code})` : ""}</dt>
                <dd className="text-ink">−{money(quote.totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/60">Shipping</dt>
              <dd className="text-ink">{quote.selectedShippingRate ? money(quote.totals.shipping) : <span className="text-ink/50">Choose a delivery option</span>}</dd>
            </div>
            {quote.totals.taxLines.length > 0 ? (
              quote.totals.taxLines.map((tax) => (
                <div key={tax.label} className="flex justify-between">
                  <dt className="text-ink/60">{tax.label}</dt>
                  <dd className="text-ink">{money(tax.amount)}</dd>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <dt className="text-ink/60">Tax</dt>
                <dd className="text-ink">{money(quote.totals.tax)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
            <p className="font-display text-base text-ink">Total</p>
            <p className="font-display text-base text-ink">{money(quote.totals.total)}</p>
          </div>
          {loading && <p className="mt-2 text-xs text-ink/50">Updating…</p>}
        </>
      )}
    </div>
  );
}
