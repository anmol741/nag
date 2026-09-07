"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import CheckoutSummary from "@/components/CheckoutSummary";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export default function CheckoutPageClient() {
  const { lines, subtotal, gst, pst, total } = useCart();
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);

  if (lines.length === 0) {
    return (
      <ComingSoonPanel
        title="Checkout"
        description="Your cart is empty. Add products from the shop to check out — or contact us for wholesale ordering today."
      />
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Checkout</h1>

        <form onSubmit={(e) => e.preventDefault()} className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <fieldset>
              <legend className="font-display text-xl text-ink">Billing Address</legend>
              <AddressFields prefix="billing" />
            </fieldset>

            <fieldset>
              <legend className="sr-only">Shipping Address</legend>
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={shipToDifferentAddress}
                  onChange={(e) => setShipToDifferentAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-ink/20 text-gold focus:ring-gold"
                />
                Ship to a different address
              </label>
              {shipToDifferentAddress && (
                <div className="mt-4">
                  <h3 className="font-display text-xl text-ink">Shipping Address</h3>
                  <AddressFields prefix="shipping" />
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Order Notes</legend>
              <textarea
                name="order-notes"
                rows={4}
                placeholder="Notes about your order, e.g. special delivery instructions"
                className="mt-3 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Payment Method</legend>
              <p className="mt-3 rounded-md border border-dashed border-ink/15 bg-cream p-4 text-sm text-ink/60">
                Payment methods will be presented here once checkout is connected to WooCommerce
                (the options configured in the store, not hard-coded).
              </p>
            </fieldset>

            <button
              type="submit"
              disabled
              title="Checkout will be enabled once WooCommerce payment processing is connected"
              className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink disabled:opacity-40 sm:w-auto"
            >
              Place Order
            </button>
          </div>

          <CheckoutSummary lines={lines} subtotal={subtotal} gst={gst} pst={pst} total={total} />
        </form>
      </div>
    </section>
  );
}

function AddressFields({ prefix }: { prefix: string }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field prefix={prefix} name="first-name" label="First Name" />
      <Field prefix={prefix} name="last-name" label="Last Name" />
      <Field prefix={prefix} name="address" label="Street Address" full />
      <Field prefix={prefix} name="city" label="City" />
      <Field prefix={prefix} name="province" label="Province" />
      <Field prefix={prefix} name="postal-code" label="Postal Code" />
      <Field prefix={prefix} name="country" label="Country" />
    </div>
  );
}

function Field({
  prefix,
  name,
  label,
  full = false,
}: {
  prefix: string;
  name: string;
  label: string;
  full?: boolean;
}) {
  const id = `${prefix}-${name}`;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </div>
  );
}
