"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, updateQuantity, removeFromCart } from "@/lib/cart";
import { BagIcon, CloseIcon } from "./icons";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function MiniCart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, subtotal } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white text-ink shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <BagIcon className="h-5 w-5" /> Your Cart
          </h2>
          <button type="button" aria-label="Close cart" onClick={onClose} className="p-1 hover:text-gold-dark">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BagIcon className="h-10 w-10 text-ink/20" />
              <p className="mt-4 text-sm text-ink/60">Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="mt-4 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Shop Online
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {lines.map((line) => (
                <li key={`${line.productId}-${line.variationId ?? "simple"}`} className="flex gap-3 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-ink/10 bg-cream">
                    <Image src={line.image.src} alt={line.image.alt} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{line.name}</p>
                    {line.attributes && Object.keys(line.attributes).length > 0 && (
                      <p className="text-xs text-ink/50">
                        {Object.entries(line.attributes)
                          .map(([name, value]) => `${name}: ${value}`)
                          .join(", ")}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-xs text-ink/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.name}`}
                          disabled={line.quantity <= 1}
                          onClick={() => updateQuantity(line.productId, line.quantity - 1, line.variationId)}
                          className="px-1.5 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span aria-live="polite">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.name}`}
                          disabled={line.stockLimit !== undefined && line.quantity >= line.stockLimit}
                          onClick={() => updateQuantity(line.productId, line.quantity + 1, line.variationId)}
                          className="px-1.5 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-ink">{currency.format(line.price * line.quantity)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name} from cart`}
                      onClick={() => removeFromCart(line.productId, line.variationId)}
                      className="mt-1 text-xs text-ink/40 underline-offset-2 hover:text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-ink/10 px-5 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-semibold text-ink">{currency.format(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/40">Taxes and shipping calculated at checkout.</p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-center text-sm font-semibold text-ink hover:border-gold"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 rounded-md bg-gold px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
