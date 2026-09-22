"use client";

import { useState } from "react";
import Link from "next/link";
import { clearCart, useCart } from "@/lib/cart";
import CartItem from "@/components/CartItem";
import CartSummary from "@/components/CartSummary";
import EmptyState from "@/components/EmptyState";
import { BagIcon } from "@/components/icons";

export default function CartPageClient() {
  const { lines, subtotal, gst, pst, total } = useCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (lines.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={BagIcon}
            title="Your Cart Is Empty"
            description="Add products from the shop to get started. Online checkout is being finalized — to order wholesale supplies right now, give us a call or visit the Langley storefront."
            actions={[
              { label: "Shop Online", href: "/shop" },
              { label: "Contact Us", href: "/contact", variant: "secondary" },
            ]}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-ink">Your Cart</h1>
          <Link href="/shop" className="text-sm font-medium text-gold-dark hover:underline">
            ← Continue Shopping
          </Link>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {lines.map((line) => (
                <CartItem key={`${line.productId}-${line.variationId ?? "simple"}`} line={line} />
              ))}
            </div>

            <div className="mt-4">
              {confirmingClear ? (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
                  <span className="text-red-700">Remove all items from your cart?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setConfirmingClear(false);
                    }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Yes, clear cart
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:border-gold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  className="text-xs font-medium text-ink/50 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
          <CartSummary subtotal={subtotal} gst={gst} pst={pst} total={total} />
        </div>
      </div>
    </section>
  );
}
