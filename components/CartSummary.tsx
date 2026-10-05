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

      {couponSlot && <p className="mt-3 text-xs text-ink/60">Have a coupon? You can apply it at checkout.</p>}

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
          <dt className="text-ink/60">GST (5%, estimated)</dt>
          <dd className="text-ink">{currency.format(gst)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">PST (7%, estimated)</dt>
          <dd className="text-ink">{currency.format(pst)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
        <p className="font-display text-base text-ink">Estimated Total</p>
        <p className="font-display text-base text-ink">{currency.format(total)}</p>
      </div>
      <p className="mt-2 text-xs text-ink/50">Final prices, taxes and shipping are confirmed at checkout.</p>

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
