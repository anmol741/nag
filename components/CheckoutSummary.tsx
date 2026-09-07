import Image from "next/image";
import type { CartLine } from "@/lib/cart";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function CheckoutSummary({
  lines,
  subtotal,
  gst,
  pst,
  total,
}: {
  lines: CartLine[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-6">
      <h2 className="font-display text-lg text-ink">Your Order</h2>
      <ul className="mt-4 divide-y divide-ink/10">
        {lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-white">
              <Image src={line.image.src} alt={line.image.alt} fill sizes="56px" className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{line.name}</p>
              <p className="text-xs text-ink/50">Qty {line.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-ink">{currency.format(line.price * line.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/60">Subtotal</dt>
          <dd className="text-ink">{currency.format(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">GST (5%)</dt>
          <dd className="text-ink">{currency.format(gst)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">PST (7%)</dt>
          <dd className="text-ink">{currency.format(pst)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">Shipping</dt>
          <dd className="text-ink/50">Calculated at checkout</dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
        <p className="font-display text-base text-ink">Total</p>
        <p className="font-display text-base text-ink">{currency.format(total)}</p>
      </div>
    </div>
  );
}
