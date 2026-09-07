import Link from "next/link";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function CartSummary({
  subtotal,
  gst,
  pst,
  total,
  showCheckoutButton = true,
  couponSlot = true,
}: {
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  showCheckoutButton?: boolean;
  couponSlot?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-6">
      <h2 className="font-display text-lg text-ink">Order Summary</h2>

      {couponSlot && (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-4 flex gap-2"
          aria-label="Apply coupon code"
        >
          <label htmlFor="coupon-code" className="sr-only">
            Coupon code
          </label>
          <input
            id="coupon-code"
            type="text"
            placeholder="Coupon code"
            disabled
            title="Coupons will be available once checkout is connected to WooCommerce"
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled
            className="shrink-0 rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink/50 disabled:opacity-50"
          >
            Apply
          </button>
        </form>
      )}

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/60">Subtotal</dt>
          <dd className="text-ink">{currency.format(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">Shipping</dt>
          <dd className="text-ink/50">Calculated at checkout</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">GST (5%)</dt>
          <dd className="text-ink">{currency.format(gst)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">PST (7%)</dt>
          <dd className="text-ink">{currency.format(pst)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
        <p className="font-display text-base text-ink">Total</p>
        <p className="font-display text-base text-ink">{currency.format(total)}</p>
      </div>

      {showCheckoutButton && (
        <Link
          href="/checkout"
          className="mt-6 block rounded-md bg-gold px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-gold-light"
        >
          Proceed to Checkout
        </Link>
      )}
    </div>
  );
}
