"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { CANADIAN_PROVINCES } from "@/lib/canadian-provinces";
import { isValidCanadianPhone, isValidCanadianPostalCode } from "@/lib/validation";
import CheckoutSummary from "@/components/CheckoutSummary";
import EmptyState from "@/components/EmptyState";
import { ClipboardIcon } from "@/components/icons";

// Deliberately decoupled from lib/server/woocommerce-admin.ts's
// CustomerProfile type — that module is server-only, and this is a client
// component, so this shape is just the handful of fields checkout actually
// prefills from, not the full server type.
export interface CheckoutProfile {
  firstName: string;
  lastName: string;
  email: string;
  salonName?: string;
  certification?: string;
  billing: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    phone?: string;
  };
}

interface AddressFormValues {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
}

const emptyAddress: AddressFormValues = { fullName: "", addressLine1: "", addressLine2: "", city: "", province: "", postalCode: "" };

function profileToAddress(profile: CheckoutProfile | null): AddressFormValues {
  if (!profile) return emptyAddress;
  return {
    fullName: `${profile.firstName} ${profile.lastName}`.trim(),
    addressLine1: profile.billing.addressLine1,
    addressLine2: profile.billing.addressLine2 ?? "",
    city: profile.billing.city,
    province: profile.billing.province,
    postalCode: profile.billing.postalCode,
  };
}

/**
 * Checkout requires a logged-in account (guest checkout is not offered —
 * see the Phase 2 report). Whether to redirect a logged-out visitor can
 * only be decided once the cart is known, and the cart only exists
 * client-side (localStorage), so this decision can't live in proxy.ts —
 * it's made here, after mount, once useCart() has actually read it. An
 * empty cart still shows the ordinary empty-cart state either way, logged
 * in or not.
 */
export default function CheckoutPageClient({ loggedIn, profile }: { loggedIn: boolean; profile: CheckoutProfile | null }) {
  const router = useRouter();
  const { lines, subtotal, gst, pst, total } = useCart();
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [billing, setBilling] = useState<AddressFormValues>(() => profileToAddress(profile));
  const [shipping, setShipping] = useState<AddressFormValues>(emptyAddress);
  const [phone, setPhone] = useState(profile?.billing.phone ?? "");
  const [salonName, setSalonName] = useState(profile?.salonName ?? "");
  const [certification, setCertification] = useState(profile?.certification ?? "");

  useEffect(() => {
    if (lines.length > 0 && !loggedIn) {
      router.push("/account?returnTo=/checkout");
    }
  }, [lines.length, loggedIn, router]);

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

  if (!loggedIn) {
    // The redirect effect above is already firing — this avoids briefly
    // flashing the full checkout form before it takes effect.
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <p className="text-ink/60">Please log in to continue to checkout — redirecting…</p>
        </div>
      </section>
    );
  }

  function validate(): string | null {
    if (!phone || !isValidCanadianPhone(phone)) return "Enter a valid Canadian phone number.";
    if (!salonName.trim()) return "Salon/spa name is required.";
    if (!certification.trim()) return "Certification is required.";
    for (const [label, address] of [
      ["Billing", billing],
      ...(shipToDifferentAddress ? [["Shipping", shipping] as const] : []),
    ] as const) {
      if (!address.fullName.trim()) return `${label} full name is required.`;
      if (!address.addressLine1.trim()) return `${label} address line 1 is required.`;
      if (!address.city.trim()) return `${label} city is required.`;
      if (!address.province) return `${label} province is required.`;
      if (!isValidCanadianPostalCode(address.postalCode)) return `${label} postal code isn't a valid Canadian postal code.`;
    }
    return null;
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Checkout</h1>

        <p className="mt-4 rounded-md border border-gold/40 bg-cream p-4 text-sm text-ink/80">
          Online checkout setup is being completed. Your cart has been saved. Please contact us at{" "}
          <a href="tel:+17782787727" className="text-gold-dark hover:underline">
            (778) 278-7727
          </a>{" "}
          if you need assistance placing an order.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(validate());
          }}
          className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]"
        >
          <div className="space-y-10">
            <fieldset>
              <legend className="font-display text-xl text-ink">Contact &amp; Professional Details</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkout-email" className="block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={profile?.email ?? ""}
                    readOnly
                    disabled
                    className="mt-1 w-full cursor-not-allowed rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink/60 outline-none"
                  />
                </div>
                <TextField id="checkout-phone" label="Phone" value={phone} onChange={setPhone} />
                <TextField id="checkout-salon" label="Salon/Spa Name" value={salonName} onChange={setSalonName} />
                <TextField id="checkout-certification" label="Certification" value={certification} onChange={setCertification} />
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Billing Address</legend>
              <p className="mt-1 text-xs text-ink/50">We currently ship within Canada only.</p>
              <AddressFields prefix="billing" values={billing} onChange={setBilling} />
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
                  <AddressFields prefix="shipping" values={shipping} onChange={setShipping} />
                </div>
              )}
            </fieldset>

            {formError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
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

function AddressFields({
  prefix,
  values,
  onChange,
}: {
  prefix: string;
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
}) {
  function set<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <TextField id={`${prefix}-full-name`} label="Full Name" full value={values.fullName} onChange={(v) => set("fullName", v)} />
      <TextField id={`${prefix}-address-1`} label="Address Line 1" full value={values.addressLine1} onChange={(v) => set("addressLine1", v)} />
      <TextField id={`${prefix}-address-2`} label="Address Line 2 (optional)" full value={values.addressLine2} onChange={(v) => set("addressLine2", v)} />
      <TextField id={`${prefix}-city`} label="City" value={values.city} onChange={(v) => set("city", v)} />
      <div>
        <label htmlFor={`${prefix}-province`} className="block text-sm font-medium text-ink">
          Province
        </label>
        <select
          id={`${prefix}-province`}
          required
          value={values.province}
          onChange={(e) => set("province", e.target.value)}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="" disabled>
            Select a province
          </option>
          {CANADIAN_PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <TextField id={`${prefix}-postal-code`} label="Postal Code" value={values.postalCode} onChange={(v) => set("postalCode", v)} placeholder="A1A 1A1" />
      <div>
        <label htmlFor={`${prefix}-country`} className="block text-sm font-medium text-ink">
          Country
        </label>
        <select
          id={`${prefix}-country`}
          value="CA"
          onChange={() => {}}
          aria-readonly
          className="mt-1 w-full cursor-default rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none"
        >
          <option value="CA">Canada</option>
        </select>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  full = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </div>
  );
}
