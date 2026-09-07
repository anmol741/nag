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
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${line.slug}`} className="text-sm font-medium text-ink hover:text-gold-dark">
            {line.name}
          </Link>
          <p className="shrink-0 text-sm font-semibold text-ink">{currency.format(line.price * line.quantity)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <QuantitySelector value={line.quantity} onChange={(next) => updateQuantity(line.productId, next)} />
          <button
            type="button"
            onClick={() => removeFromCart(line.productId)}
            className="text-xs font-medium text-ink/50 underline-offset-2 hover:text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
