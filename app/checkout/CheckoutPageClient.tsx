"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearCart, removeFromCart, updateQuantity, useCart } from "@/lib/cart";
import { CANADIAN_PROVINCES } from "@/lib/canadian-provinces";
import { isValidCanadianPhone, isValidCanadianPostalCode } from "@/lib/validation";
import { commerce } from "@/lib/site-config";
import type { CheckoutQuote, QuoteIssue } from "@/lib/checkout/types";
import CheckoutSummary from "@/components/CheckoutSummary";
import EmptyState from "@/components/EmptyState";
import AccountStatusNotice, { type AccountStatusView } from "@/components/AccountStatusNotice";
import ETransferInstructions from "@/components/ETransferInstructions";
import { ClipboardIcon } from "@/components/icons";

interface ProfileAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Deliberately decoupled from lib/server/woocommerce-admin.ts (server-only)
// — just the fields checkout prefills from.
export interface CheckoutProfile {
  email: string;
  firstName: string;
  lastName: string;
  salonName?: string;
  billing: ProfileAddress;
  shipping: ProfileAddress;
}

interface AddressValues {
  firstName: string;
  lastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

const emptyAddress: AddressValues = {
  firstName: "",
  lastName: "",
  company: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
};

function fromProfile(address: ProfileAddress | undefined, fallback: Partial<AddressValues> = {}): AddressValues {
  // Saved non-Canadian addresses aren't prefilled — we ship within Canada only.
  if (!address || (address.country && address.country !== "CA")) return { ...emptyAddress, ...fallback };
  return {
    firstName: address.firstName || fallback.firstName || "",
    lastName: address.lastName || fallback.lastName || "",
    company: address.company ?? fallback.company ?? "",
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    phone: address.phone ?? fallback.phone ?? "",
  };
}

const QUOTE_DEBOUNCE_MS = 400;
const KEY_PREFIX = "nagsbeauty:checkout-key:";

/** Idempotency key for this exact cart, kept in sessionStorage so a reload-and-retry after a network failure reuses it (and gets the original order back, not a duplicate). */
function getIdempotencyKey(cartSignature: string): string {
  const storageKey = KEY_PREFIX + cartSignature;
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function forgetIdempotencyKeys() {
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Checkout requires a logged-in account (guest checkout isn't offered).
 * The logged-out redirect is decided here, after mount, because the cart
 * only exists client-side.
 */
export default function CheckoutPageClient({
  loggedIn,
  serviceUnavailable,
  accountStatus,
  profile,
  sessionEmail,
}: {
  loggedIn: boolean;
  serviceUnavailable: boolean;
  accountStatus: AccountStatusView | null;
  profile: CheckoutProfile | null;
  sessionEmail: string;
}) {
  const router = useRouter();
  const { lines } = useCart();

  const nameFallback = { firstName: profile?.firstName ?? "", lastName: profile?.lastName ?? "", company: profile?.salonName ?? "" };
  const [billing, setBilling] = useState<AddressValues>(() => fromProfile(profile?.billing, nameFallback));
  const [shipping, setShipping] = useState<AddressValues>(() => fromProfile(profile?.shipping, nameFallback));
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  /** Bumped to force a fresh quote (e.g. after WooCommerce reports a price or stock change). */
  const [quoteNonce, setQuoteNonce] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const quoteLines = useMemo(() => lines.map((l) => ({ productId: l.productId, variationId: l.variationId, quantity: l.quantity })), [lines]);
  const cartSignature = useMemo(() => JSON.stringify(quoteLines), [quoteLines]);

  const selectedRate = quote?.shippingRates.find((r) => r.id === shippingMethod) ?? null;
  const isPickup = Boolean(selectedRate?.isLocalPickup);
  const destinationSource = shipToDifferentAddress && !isPickup ? shipping : billing;
  const destinationKey = `${destinationSource.province}|${destinationSource.postalCode}|${destinationSource.city}`;

  const canCheckout = Boolean(accountStatus?.canCheckout);

  useEffect(() => {
    if (lines.length > 0 && !loggedIn && !serviceUnavailable) {
      router.push("/account?returnTo=/checkout");
    }
  }, [lines.length, loggedIn, serviceUnavailable, router]);

  // Re-quote from WooCommerce whenever the cart, destination, delivery
  // option or coupon changes. Debounced so typing a postal code doesn't
  // fire a request per keystroke.
  useEffect(() => {
    if (!loggedIn || !canCheckout || quoteLines.length === 0) return;
    const controller = new AbortController();
    const [province, postalCode, city] = destinationKey.split("|");
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: JSON.parse(cartSignature),
            coupon: appliedCoupon,
            shippingMethod,
            destination: { province, postalCode, city, country: "CA" },
          }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as { quote?: CheckoutQuote; error?: string; loggedOut?: boolean };
        if (res.status === 401 && data.loggedOut) {
          router.push("/account?returnTo=/checkout");
          return;
        }
        if (!res.ok || !data.quote) {
          setQuoteError(data.error ?? "We couldn't calculate your order total. Please try again.");
          return;
        }
        const next = data.quote;
        setQuote(next);
        setQuoteError(null);
        if (next.selectedShippingRate !== shippingMethod) setShippingMethod(next.selectedShippingRate);
        if (appliedCoupon && next.coupon && !next.coupon.applied) {
          setCouponMessage({ text: next.coupon.message ?? "This coupon can't be applied to your order.", error: true });
          setAppliedCoupon("");
        } else if (appliedCoupon && next.coupon?.applied) {
          setCouponMessage({ text: `Coupon "${next.coupon.code}" applied.`, error: false });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setQuoteError("We couldn't reach the server to calculate your total. Please check your connection.");
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loggedIn, canCheckout, quoteLines.length, cartSignature, destinationKey, shippingMethod, appliedCoupon, quoteNonce, router]);

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

  if (serviceUnavailable) {
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <h1 className="font-display text-3xl text-ink">Checkout</h1>
          <p className="mt-4 text-ink/60">Checkout is temporarily unavailable. Your cart has been saved — please try again in a few minutes.</p>
        </div>
      </section>
    );
  }

  if (!loggedIn) {
    // The redirect effect above is already firing.
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-md px-6 text-center">
          <p className="text-ink/60">Please log in to continue to checkout — redirecting…</p>
        </div>
      </section>
    );
  }

  if (!canCheckout && accountStatus) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="font-display text-3xl text-ink">Checkout</h1>
          <div className="mt-8">
            <AccountStatusNotice status={accountStatus} context="checkout" />
          </div>
          <p className="mt-6 text-sm text-ink/60">
            Your cart has been saved. Questions? <Link href="/contact" className="text-gold-dark hover:underline">Contact us</Link>.
          </p>
        </div>
      </section>
    );
  }

  function applyIssueFixes(issues: QuoteIssue[]) {
    for (const issue of issues) {
      if (issue.code === "insufficient_stock" && issue.availableQuantity && issue.availableQuantity > 0) {
        updateQuantity(issue.productId, issue.availableQuantity, issue.variationId);
      } else {
        removeFromCart(issue.productId, issue.variationId);
      }
    }
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const check = (prefix: string, a: AddressValues, phoneRequired: boolean) => {
      if (!a.firstName.trim()) errors[`${prefix}FirstName`] = "First name is required.";
      if (!a.lastName.trim()) errors[`${prefix}LastName`] = "Last name is required.";
      if (!a.addressLine1.trim()) errors[`${prefix}AddressLine1`] = "Street address is required.";
      if (!a.city.trim()) errors[`${prefix}City`] = "City is required.";
      if (!a.province) errors[`${prefix}Province`] = "Select a province.";
      if (!isValidCanadianPostalCode(a.postalCode)) errors[`${prefix}PostalCode`] = "Enter a valid Canadian postal code.";
      if (phoneRequired && !isValidCanadianPhone(a.phone)) errors[`${prefix}Phone`] = "Enter a valid Canadian phone number.";
    };
    check("billing", billing, true);
    if (shipToDifferentAddress && !isPickup) check("shipping", shipping, false);
    if (!shippingMethod) errors.shippingMethod = "Choose a delivery option.";
    if (!agreedToTerms) errors.agreedToTerms = "Please agree to the Terms and Conditions and Privacy Policy.";
    return errors;
  }

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return; // double-click guard (the server has its own)
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Please correct the highlighted fields.");
      return;
    }
    if (!quote || quoteLoading || quote.issues.length > 0) {
      setFormError("Please wait for your order total to finish updating.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: getIdempotencyKey(cartSignature),
          lines: quoteLines,
          coupon: appliedCoupon,
          shippingMethod,
          billing: { ...billing, country: "CA" },
          shipping: { ...shipping, country: "CA" },
          shipToDifferentAddress: shipToDifferentAddress && !isPickup,
          customerNote,
          paymentMethod: "nag_etransfer",
          expectedTotal: quote.totals.total,
          agreedToTerms,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        order?: { orderId: number };
        error?: string;
        code?: string;
        fieldErrors?: Record<string, string>;
        loggedOut?: boolean;
      };
      if (res.ok && data.ok && data.order) {
        clearCart();
        forgetIdempotencyKeys();
        router.push(`/account/orders/${data.order.orderId}?placed=1`);
        return;
      }
      if (data.loggedOut) {
        router.push("/account?returnTo=/checkout");
        return;
      }
      setFieldErrors(data.fieldErrors ?? {});
      setFormError(data.error ?? "We couldn't place your order. Please try again.");
      if (data.code === "nag_total_changed" || data.code === "nag_stock") {
        // Prices or stock changed in WooCommerce — fetch a fresh quote so
        // the customer reviews the new total before ordering again.
        setQuote(null);
        setQuoteNonce((n) => n + 1);
      }
    } catch {
      setFormError("We couldn't reach the server. Please try again — retrying won't create a duplicate order.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const placeDisabled = submitting || quoteLoading || !quote || quote.issues.length > 0 || Boolean(quoteError);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Checkout</h1>

        <form onSubmit={placeOrder} noValidate className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <fieldset>
              <legend className="font-display text-xl text-ink">Contact</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkout-email" className="block text-sm font-medium text-ink">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={profile?.email ?? sessionEmail}
                    readOnly
                    aria-readonly="true"
                    className="mt-1 w-full cursor-not-allowed rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink/60 outline-none"
                  />
                </div>
                <TextField
                  id="checkout-phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  value={billing.phone}
                  onChange={(v) => setBilling({ ...billing, phone: v })}
                  error={fieldErrors.billingPhone}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Billing Address</legend>
              <p className="mt-1 text-xs text-ink/50">We ship within Canada only.</p>
              <AddressFields prefix="billing" values={billing} onChange={setBilling} errors={fieldErrors} autoCompleteSection="billing" />
            </fieldset>

            <fieldset aria-describedby="delivery-help">
              <legend className="font-display text-xl text-ink">Delivery</legend>
              <p id="delivery-help" className="mt-1 text-xs text-ink/50">
                Orders are processed within {commerce.processingTime}. Shipping is available within Canada only.
              </p>
              <div className="mt-4 space-y-2" aria-live="polite">
                {!quote && quoteLoading && <p className="text-sm text-ink/60">Loading delivery options…</p>}
                {quote && quote.shippingRates.length === 0 && (
                  <p className="rounded-md border border-dashed border-ink/15 bg-cream p-3 text-sm text-ink/60">
                    {destinationSource.province && isValidCanadianPostalCode(destinationSource.postalCode)
                      ? "No delivery options are available for this address. Please check it, or contact us."
                      : "Enter your province and postal code to see delivery options."}
                  </p>
                )}
                {quote?.shippingRates.map((rate) => (
                  <label
                    key={rate.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                      shippingMethod === rate.id ? "border-gold bg-cream" : "border-ink/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={rate.id}
                      checked={shippingMethod === rate.id}
                      onChange={() => setShippingMethod(rate.id)}
                      className="mt-0.5 h-4 w-4 text-gold focus:ring-gold"
                    />
                    <span className="flex-1">
                      <span className="flex justify-between gap-3 font-medium text-ink">
                        <span>{rate.label}</span>
                        <span>{(Number.parseFloat(rate.cost) || 0) === 0 ? "Free" : currency.format(Number.parseFloat(rate.cost))}</span>
                      </span>
                      {rate.isLocalPickup && (
                        <span className="mt-1 block text-xs text-ink/60">
                          Pick up at {commerce.pickupLocation}. Hours: {commerce.pickupHours}. We&rsquo;ll email you when your order is ready.
                        </span>
                      )}
                    </span>
                  </label>
                ))}
                {fieldErrors.shippingMethod && <p className="text-xs text-red-600">{fieldErrors.shippingMethod}</p>}
              </div>
            </fieldset>

            {!isPickup && (
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
                    <h2 className="font-display text-xl text-ink">Shipping Address</h2>
                    <p className="mt-1 text-xs text-ink/50">We ship within Canada only.</p>
                    <AddressFields prefix="shipping" values={shipping} onChange={setShipping} errors={fieldErrors} autoCompleteSection="shipping" />
                  </div>
                )}
              </fieldset>
            )}

            <fieldset>
              <legend className="font-display text-xl text-ink">Coupon</legend>
              <div className="mt-3 flex gap-2">
                <label htmlFor="checkout-coupon" className="sr-only">
                  Coupon code
                </label>
                <input
                  id="checkout-coupon"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  aria-describedby={couponMessage ? "checkout-coupon-message" : undefined}
                  className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCouponMessage(null);
                    setAppliedCoupon(couponInput.trim().toLowerCase());
                  }}
                  disabled={!couponInput.trim() || quoteLoading}
                  className="shrink-0 rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:border-gold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  Apply
                </button>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon("");
                      setCouponInput("");
                      setCouponMessage(null);
                    }}
                    className="shrink-0 rounded-md px-3 py-2 text-sm text-ink/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-gold/40"
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponMessage && (
                <p id="checkout-coupon-message" aria-live="polite" className={`mt-2 text-xs ${couponMessage.error ? "text-red-600" : "text-ink/70"}`}>
                  {couponMessage.text}
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Order Notes</legend>
              <label htmlFor="checkout-notes" className="sr-only">
                Order notes (optional)
              </label>
              <textarea
                id="checkout-notes"
                rows={4}
                maxLength={1000}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Notes about your order, e.g. special delivery instructions (optional)"
                className="mt-3 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
              />
            </fieldset>

            <fieldset>
              <legend className="font-display text-xl text-ink">Payment Method</legend>
              <label className="mt-3 flex items-center gap-3 rounded-md border border-gold bg-cream p-3 text-sm font-medium text-ink">
                <input type="radio" name="paymentMethod" value="nag_etransfer" checked readOnly className="h-4 w-4 text-gold focus:ring-gold" />
                Interac e-Transfer
              </label>
              <div className="mt-3">
                <ETransferInstructions />
              </div>
            </fieldset>

            <div>
              <label className="flex items-start gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  aria-invalid={Boolean(fieldErrors.agreedToTerms)}
                  aria-describedby={fieldErrors.agreedToTerms ? "checkout-terms-error" : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/20 text-gold focus:ring-gold"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="/terms-and-conditions" className="underline hover:text-gold-dark">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="underline hover:text-gold-dark">
                    Privacy Policy
                  </Link>
                  , including the{" "}
                  <Link href="/shipping-policy" className="underline hover:text-gold-dark">
                    Shipping Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/return-refund-policy" className="underline hover:text-gold-dark">
                    Return &amp; Refund Policy
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.agreedToTerms && (
                <p id="checkout-terms-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.agreedToTerms}
                </p>
              )}
            </div>

            <div aria-live="polite">
              {formError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={placeDisabled}
              aria-disabled={placeDisabled}
              className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-gold/40 sm:w-auto"
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </button>
          </div>

          <div className="space-y-4">
            {quote && quote.issues.length > 0 && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Some items need attention</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {quote.issues.map((issue) => (
                    <li key={`${issue.productId}:${issue.variationId ?? ""}`}>{issue.message}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => applyIssueFixes(quote.issues)}
                  className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Update my cart
                </button>
              </div>
            )}
            <CheckoutSummary cartLines={lines} quote={quote} loading={quoteLoading} error={quoteError} />
          </div>
        </form>
      </div>
    </section>
  );
}

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

function AddressFields({
  prefix,
  values,
  onChange,
  errors,
  autoCompleteSection,
}: {
  prefix: "billing" | "shipping";
  values: AddressValues;
  onChange: (values: AddressValues) => void;
  errors: Record<string, string>;
  autoCompleteSection: "billing" | "shipping";
}) {
  function set<K extends keyof AddressValues>(key: K, value: AddressValues[K]) {
    onChange({ ...values, [key]: value });
  }
  const ac = (token: string) => `${autoCompleteSection} ${token}`;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <TextField id={`${prefix}-first-name`} label="First Name" autoComplete={ac("given-name")} value={values.firstName} onChange={(v) => set("firstName", v)} error={errors[`${prefix}FirstName`]} />
      <TextField id={`${prefix}-last-name`} label="Last Name" autoComplete={ac("family-name")} value={values.lastName} onChange={(v) => set("lastName", v)} error={errors[`${prefix}LastName`]} />
      <TextField id={`${prefix}-company`} label="Salon/Company (optional)" full autoComplete={ac("organization")} value={values.company} onChange={(v) => set("company", v)} />
      <TextField id={`${prefix}-address-1`} label="Address Line 1" full autoComplete={ac("address-line1")} value={values.addressLine1} onChange={(v) => set("addressLine1", v)} error={errors[`${prefix}AddressLine1`]} />
      <TextField id={`${prefix}-address-2`} label="Address Line 2 (optional)" full autoComplete={ac("address-line2")} value={values.addressLine2} onChange={(v) => set("addressLine2", v)} />
      <TextField id={`${prefix}-city`} label="City" autoComplete={ac("address-level2")} value={values.city} onChange={(v) => set("city", v)} error={errors[`${prefix}City`]} />
      <div>
        <label htmlFor={`${prefix}-province`} className="block text-sm font-medium text-ink">
          Province
        </label>
        <select
          id={`${prefix}-province`}
          required
          autoComplete={ac("address-level1")}
          value={values.province}
          onChange={(e) => set("province", e.target.value)}
          aria-invalid={Boolean(errors[`${prefix}Province`])}
          className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
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
        {errors[`${prefix}Province`] && <p className="mt-1 text-xs text-red-600">{errors[`${prefix}Province`]}</p>}
      </div>
      <TextField
        id={`${prefix}-postal-code`}
        label="Postal Code"
        autoComplete={ac("postal-code")}
        value={values.postalCode}
        onChange={(v) => set("postalCode", v)}
        placeholder="A1A 1A1"
        error={errors[`${prefix}PostalCode`]}
      />
      <div>
        <label htmlFor={`${prefix}-country`} className="block text-sm font-medium text-ink">
          Country
        </label>
        <input
          id={`${prefix}-country`}
          value="Canada"
          readOnly
          aria-readonly="true"
          className="mt-1 w-full cursor-default rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none"
        />
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
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
  placeholder?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
