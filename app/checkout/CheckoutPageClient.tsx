"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import CheckoutSummary from "@/components/CheckoutSummary";
import EmptyState from "@/components/EmptyState";
import { ClipboardIcon } from "@/components/icons";

// This store ships within Canada only (confirmed by the client — see
// shipping-policy). The country field below is locked to Canada rather than
// a free-text input so a non-Canadian address can't be entered at all; this
// list backs the province selector.
const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

/** Defensive re-check behind the locked country selects above — rejects a shipping address whose country value isn't Canada, e.g. if the DOM were tampered with. */
function validateCanadaOnly(formData: FormData, shipToDifferentAddress: boolean): string | null {
  const prefixes = shipToDifferentAddress ? ["billing", "shipping"] : ["billing"];
  for (const prefix of prefixes) {
    const country = formData.get(`${prefix}-country`);
    if (country !== "CA") {
      return "We're only able to ship within Canada right now. Please provide a Canadian shipping address.";
    }
  }
  return null;
}

export default function CheckoutPageClient() {
  const { lines, subtotal, gst, pst, total } = useCart();
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={ClipboardIcon}
            title="Nothing to Check Out Yet"
            description="Your cart is empty. Add products from the shop to check out — or contact us for wholesale ordering today."
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
        <h1 className="font-display text-3xl text-ink">Checkout</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAddressError(validateCanadaOnly(new FormData(e.currentTarget), shipToDifferentAddress));
          }}
          className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]"
        >
          <div className="space-y-10">
            <fieldset>
              <legend className="font-display text-xl text-ink">Billing Address</legend>
              <p className="mt-1 text-xs text-ink/50">We currently ship within Canada only.</p>
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
                  <p className="mt-1 text-xs text-ink/50">We currently ship within Canada only.</p>
                  <AddressFields prefix="shipping" />
                </div>
              )}
            </fieldset>

            {addressError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {addressError}
              </p>
            )}

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

            <p className="text-xs text-ink/50">
              Read our{" "}
              <Link href="/terms-and-conditions" className="underline hover:text-gold-dark">
                Terms and Conditions
              </Link>
              ,{" "}
              <Link href="/shipping-policy" className="underline hover:text-gold-dark">
                Shipping Policy
              </Link>
              , and{" "}
              <Link href="/return-refund-policy" className="underline hover:text-gold-dark">
                Return &amp; Refund Policy
              </Link>
              .
            </p>
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
      <ProvinceField prefix={prefix} />
      <Field prefix={prefix} name="postal-code" label="Postal Code" />
      <CountryField prefix={prefix} />
    </div>
  );
}

/** Locked to Canada — this store ships within Canada only, so there's nothing else to select. */
function CountryField({ prefix }: { prefix: string }) {
  const id = `${prefix}-country`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        Country
      </label>
      <select
        id={id}
        name={id}
        value="CA"
        onChange={() => {}}
        aria-readonly
        className="mt-1 w-full cursor-default rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none"
      >
        <option value="CA">Canada</option>
      </select>
    </div>
  );
}

function ProvinceField({ prefix }: { prefix: string }) {
  const id = `${prefix}-province`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        Province
      </label>
      <select
        id={id}
        name={id}
        required
        defaultValue=""
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
      >
        <option value="" disabled>
          Select a province
        </option>
        {CANADIAN_PROVINCES.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>
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
