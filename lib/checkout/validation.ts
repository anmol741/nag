// Pure, dependency-light server-side input validation for checkout, saved
// addresses and course payments. Safe to import from client components too
// (for instant feedback), but the server never trusts the client's own
// check — every route re-runs these. Tested in tests/checkout-validation.test.ts.
//
// Only *identifiers and intent* are accepted from the browser (product ID,
// variation ID, quantity, coupon code, chosen shipping method, address).
// Prices, stock, discounts, tax and shipping costs are never read from the
// request — WooCommerce computes them (see the bridge plugin's checkout).

import { isValidCanadianPhone, isValidCanadianPostalCode, normalizeCanadianPostalCode, normalizePhone } from "@/lib/validation";

export const CANADIAN_PROVINCE_CODES = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);

export const MAX_CHECKOUT_LINES = 50;
export const MAX_LINE_QUANTITY = 999;
export const MAX_NOTE_LENGTH = 1000;
const MAX_FIELD_LENGTH = 120;

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: "CA";
  phone?: string;
}

export interface CheckoutLineInput {
  productId: string;
  variationId?: string;
  quantity: number;
}

type FieldErrors = Record<string, string>;

function str(value: unknown, max = MAX_FIELD_LENGTH): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const NUMERIC_ID = /^[1-9]\d{0,11}$/;

/**
 * Parses an address and enforces Canada-only. Any explicit non-Canadian
 * country is rejected with a clear message rather than silently coerced,
 * so a tampered request can't slip a foreign address through.
 */
export function parseCanadianAddress(raw: unknown, prefix: string, errors: FieldErrors, options: { phoneRequired?: boolean } = {}): CheckoutAddress | null {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const firstName = str(b.firstName);
  const lastName = str(b.lastName);
  const company = str(b.company);
  const addressLine1 = str(b.addressLine1);
  const addressLine2 = str(b.addressLine2);
  const city = str(b.city);
  const province = str(b.province).toUpperCase();
  const postalCode = str(b.postalCode, 10);
  const phone = str(b.phone, 30);
  const country = str(b.country, 10).toUpperCase();

  // Collected separately: `errors` may be shared across billing+shipping.
  const own: FieldErrors = {};
  if (country && country !== "CA") own[`${prefix}Country`] = "We currently ship within Canada only.";
  if (!firstName) own[`${prefix}FirstName`] = "First name is required.";
  if (!lastName) own[`${prefix}LastName`] = "Last name is required.";
  if (!addressLine1) own[`${prefix}AddressLine1`] = "Street address is required.";
  if (!city) own[`${prefix}City`] = "City is required.";
  if (!CANADIAN_PROVINCE_CODES.has(province)) own[`${prefix}Province`] = "Select a valid Canadian province.";
  if (!isValidCanadianPostalCode(postalCode)) own[`${prefix}PostalCode`] = "Enter a valid Canadian postal code.";
  if (options.phoneRequired && !phone) own[`${prefix}Phone`] = "Phone number is required.";
  if (phone && !isValidCanadianPhone(phone)) own[`${prefix}Phone`] = "Enter a valid Canadian phone number.";

  Object.assign(errors, own);
  if (Object.keys(own).length > 0) return null;

  return {
    firstName,
    lastName,
    company: company || undefined,
    addressLine1,
    addressLine2: addressLine2 || undefined,
    city,
    province,
    postalCode: normalizeCanadianPostalCode(postalCode),
    country: "CA",
    phone: phone ? normalizePhone(phone) : undefined,
  };
}

/**
 * Parses cart lines (IDs + quantities only). Duplicate product+variation
 * lines are merged. Returns an error string for anything malformed rather
 * than guessing what the client meant.
 */
export function parseCheckoutLines(raw: unknown): { ok: true; lines: CheckoutLineInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Your cart is empty." };
  if (raw.length > MAX_CHECKOUT_LINES) return { ok: false, error: `Please check out ${MAX_CHECKOUT_LINES} or fewer different items at a time.` };

  const merged = new Map<string, CheckoutLineInput>();
  for (const entry of raw) {
    const l = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    const productId = typeof l.productId === "string" || typeof l.productId === "number" ? String(l.productId) : "";
    const variationRaw = l.variationId === undefined || l.variationId === null || l.variationId === "" ? undefined : String(l.variationId);
    const quantity = typeof l.quantity === "number" ? l.quantity : Number.NaN;

    if (!NUMERIC_ID.test(productId)) return { ok: false, error: "Your cart contains an invalid item. Please remove it and try again." };
    if (variationRaw !== undefined && !NUMERIC_ID.test(variationRaw)) return { ok: false, error: "Your cart contains an invalid product option." };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      return { ok: false, error: "Each item quantity must be a whole number between 1 and 999." };
    }

    const key = `${productId}:${variationRaw ?? ""}`;
    const existing = merged.get(key);
    const total = (existing?.quantity ?? 0) + quantity;
    if (total > MAX_LINE_QUANTITY) return { ok: false, error: "Each item quantity must be a whole number between 1 and 999." };
    merged.set(key, { productId, variationId: variationRaw, quantity: total });
  }
  return { ok: true, lines: [...merged.values()] };
}

/** WooCommerce coupon codes: letters, digits, dash, underscore, dot. Empty string = no coupon. */
export function parseCouponCode(raw: unknown): { ok: true; code: string } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") return { ok: true, code: "" };
  if (typeof raw !== "string") return { ok: false, error: "Enter a valid coupon code." };
  const code = raw.trim().toLowerCase();
  if (!code) return { ok: true, code: "" };
  if (code.length > 50 || !/^[a-z0-9._-]+$/.test(code)) return { ok: false, error: "Enter a valid coupon code." };
  return { ok: true, code };
}

/** A WooCommerce shipping rate ID, e.g. "flat_rate:3", "local_pickup:5", "nag_local_pickup". Validated for shape only — the bridge checks it against the rates WooCommerce actually offers. */
export function parseShippingMethodId(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return /^[a-z0-9_:-]{1,64}$/i.test(value) ? value : null;
}

/** Client-generated per-checkout key for duplicate-order protection. Accepts a UUID (any version) only. */
export function parseIdempotencyKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value) ? value : null;
}

export function parseCustomerNote(raw: unknown): string {
  if (typeof raw !== "string") return "";
  // Strip control characters except newlines/tabs; WooCommerce escapes on output.
  return raw.replace(/[^\P{C}\n\t]/gu, "").trim().slice(0, MAX_NOTE_LENGTH);
}

/** Shipping/tax destination for a quote — enough for WooCommerce to pick zones and tax rates while the customer is still filling in the form. */
export interface QuoteDestination {
  province: string;
  postalCode: string;
  city: string;
  country: "CA";
}

/** Returns null when the destination isn't complete/valid yet (the quote is then priced without shipping). Non-Canadian countries are refused outright. */
export function parseQuoteDestination(raw: unknown): { ok: true; destination: QuoteDestination | null } | { ok: false; error: string } {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const country = str(b.country, 10).toUpperCase();
  if (country && country !== "CA") return { ok: false, error: "We currently ship within Canada only." };
  const province = str(b.province, 4).toUpperCase();
  const postalCode = str(b.postalCode, 10);
  const city = str(b.city);
  if (!CANADIAN_PROVINCE_CODES.has(province) || !isValidCanadianPostalCode(postalCode)) return { ok: true, destination: null };
  return { ok: true, destination: { province, postalCode: normalizeCanadianPostalCode(postalCode), city, country: "CA" } };
}

/** "$1,499.00" → 149900 (cents). Returns null for anything that isn't a plain positive dollar amount. Used for course prices, which come from this app's own server-side data (lib/courses.ts), never from the browser. */
export function parseDollarsToCents(display: string): number | null {
  const match = /^\$?\s*([\d,]+)(?:\.(\d{1,2}))?$/.exec(display.trim());
  if (!match) return null;
  const whole = Number.parseInt(match[1].replace(/,/g, ""), 10);
  const fraction = match[2] ? Number.parseInt(match[2].padEnd(2, "0"), 10) : 0;
  if (!Number.isFinite(whole)) return null;
  const cents = whole * 100 + fraction;
  return cents > 0 ? cents : null;
}
