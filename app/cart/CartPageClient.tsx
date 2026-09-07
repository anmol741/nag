"use client";

import { useCart } from "@/lib/cart";
import CartItem from "@/components/CartItem";
import CartSummary from "@/components/CartSummary";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export default function CartPageClient() {
  const { lines, subtotal, gst, pst, total } = useCart();

  if (lines.length === 0) {
    return (
      <ComingSoonPanel
        title="Your Cart"
        description="Online checkout is on its way. To order wholesale supplies right now, give us a call or visit the Langley storefront."
      />
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Your Cart</h1>
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {lines.map((line) => (
              <CartItem key={line.productId} line={line} />
            ))}
          </div>
          <CartSummary subtotal={subtotal} gst={gst} pst={pst} total={total} />
        </div>
      </div>
    </section>
  );
}
