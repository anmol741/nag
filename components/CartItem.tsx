"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartLine } from "@/lib/cart";
import { removeFromCart, updateQuantity } from "@/lib/cart";
import QuantitySelector from "./QuantitySelector";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function CartItem({ line }: { line: CartLine }) {
  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-cream">
        <Image src={line.image.src} alt={line.image.alt} fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div>
            <Link href={`/products/${line.slug}`} className="text-sm font-medium text-ink hover:text-gold-dark">
              {line.name}
            </Link>
            {line.attributes && Object.keys(line.attributes).length > 0 && (
              <p className="mt-0.5 text-xs text-ink/50">
                {Object.entries(line.attributes)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join(", ")}
              </p>
            )}
            <p className="mt-0.5 text-xs text-ink/40">{currency.format(line.price)} each</p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-ink">{currency.format(line.price * line.quantity)}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <QuantitySelector
            value={line.quantity}
            max={line.stockLimit}
            onChange={(next) => updateQuantity(line.productId, next, line.variationId)}
          />
          <button
            type="button"
            aria-label={`Remove ${line.name} from cart`}
            onClick={() => removeFromCart(line.productId, line.variationId)}
            className="text-xs font-medium text-ink/50 underline-offset-2 hover:text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
        {line.stockLimit !== undefined && line.quantity >= line.stockLimit && (
          <p className="mt-1 text-xs text-gold-dark">Only {line.stockLimit} in stock.</p>
        )}
      </div>
    </div>
  );
}
