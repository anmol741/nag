import "server-only";
import { CUSTOMER_META_KEYS } from "./wp-auth";

// Server-only, ADMIN-scoped WooCommerce REST API v3 access — distinct from
// lib/woocommerce.ts, which only ever calls the public, unauthenticated
// wc/store/v1 endpoints. Everything in this file requires
// WOOCOMMERCE_CONSUMER_KEY/WOOCOMMERCE_CONSUMER_SECRET (server environment
// only — never sent to, or readable by, the browser) and is used
// exclusively to look up a customer's OWN profile/orders, by the customer
// ID from their verified session (see lib/server/session.ts) — never by an
// ID supplied from the browser.
//
// The wc/v3 customers/orders schema used below is WooCommerce's own
// stable, documented REST API (the same API family this store already
// exposes — confirmed present via /?rest_route=/ discovery). Unlike the
// customer-login question (see lib/server/wp-auth.ts), there's no
// guesswork here: this is the real, official contract. It simply can't
// run until real admin keys are configured, which is why every export
// below is gated behind adminApiConfigured().

const STORE_URL = (process.env.WOOCOMMERCE_STORE_URL ?? "https://nagsbeautysupply.com").replace(/\/+$/, "");

export type AdminApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "service_unavailable" }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "upstream_error" };

export interface Address {
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

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  billing: Address;
  shipping: Address;
  salonName?: string;
  /** Whether a certification document is on file — the file itself is never exposed here (admin-only download in WordPress). */
  certificationOnFile: boolean;
}

export interface OrderSummary {
  id: string;
  number: string;
  date: string;
  status: string;
  total: string;
}

export interface OrderLineItem {
  name: string;
  quantity: number;
  total: string;
  /** Selected variation attributes, e.g. "Size: 50ml". */
  options: string[];
}

export interface OrderDetail extends OrderSummary {
  items: OrderLineItem[];
  billing: Address;
  shipping: Address;
  paymentMethod: string;
  paymentMethodTitle: string;
  shippingMethods: { methodId: string; title: string; total: string }[];
  isLocalPickup: boolean;
  pickupReady: boolean;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  totalTax: string;
  customerNote: string;
  coupons: string[];
  course?: { title: string; paymentType: "full" | "deposit"; coursePrice: string; amountDue: string; remainingBalance: string };
}

function adminApiConfigured(): boolean {
  return Boolean(process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET);
}

async function wcAdminRequest<T>(
  route: string,
  params: Record<string, string> = {},
  init: { method?: "GET" | "PUT"; body?: unknown } = {}
): Promise<AdminApiResult<T>> {
  if (!adminApiConfigured()) return { ok: false, reason: "service_unavailable" };

  const key = process.env.WOOCOMMERCE_CONSUMER_KEY!;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

  const url = new URL(`${STORE_URL}/`);
  const search = new URLSearchParams({ rest_route: `/wc/v3${route}`, ...params });
  url.search = search.toString();

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: init.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        // Basic Auth over HTTPS — WooCommerce's documented method for the
        // admin REST API. Never logged; never sent to the browser.
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[woocommerce-admin] network error", error);
    return { ok: false, reason: "upstream_error" };
  }

  if (response.status === 404) return { ok: false, reason: "not_found" };
  if (!response.ok) {
    console.error("[woocommerce-admin] non-OK response", response.status, route);
    return { ok: false, reason: "upstream_error" };
  }

  try {
    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    console.error("[woocommerce-admin] failed to parse JSON", error);
    return { ok: false, reason: "upstream_error" };
  }
}

// Raw wire shapes (WooCommerce REST API v3)
interface WcAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
}
interface WcMeta {
  key: string;
  value: unknown;
}
interface WcCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: WcAddress;
  shipping: WcAddress;
  meta_data: WcMeta[];
}
interface WcLineItem {
  name: string;
  quantity: number;
  total: string;
  meta_data?: { key: string; value: unknown; display_key?: string; display_value?: unknown }[];
}
interface WcShippingLine {
  method_id: string;
  method_title: string;
  total: string;
}
interface WcOrder {
  id: number;
  number: string;
  date_created: string;
  status: string;
  total: string;
  customer_id: number;
  line_items: WcLineItem[];
  billing: WcAddress;
  shipping: WcAddress;
  payment_method?: string;
  payment_method_title?: string;
  shipping_lines?: WcShippingLine[];
  coupon_lines?: { code: string }[];
  discount_total?: string;
  shipping_total?: string;
  total_tax?: string;
  customer_note?: string;
  meta_data?: WcMeta[];
}

function mapAddress(raw: WcAddress): Address {
  return {
    firstName: raw.first_name,
    lastName: raw.last_name,
    company: raw.company || undefined,
    addressLine1: raw.address_1,
    addressLine2: raw.address_2 || undefined,
    city: raw.city,
    province: raw.state,
    postalCode: raw.postcode,
    country: raw.country,
    phone: raw.phone || undefined,
  };
}

function metaValue(meta: WcMeta[] | undefined, key: string): string | undefined {
  const value = (meta ?? []).find((m) => m.key === key)?.value;
  if (typeof value === "string" && value) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

/** WooCommerce local-pickup method IDs (classic and block checkout) plus the bridge plugin's own Langley pickup rate. */
export const LOCAL_PICKUP_METHOD_IDS = new Set(["local_pickup", "pickup_location", "nag_local_pickup"]);

/** Customer-facing order status labels, including the bridge plugin's custom "ready for pickup" status. */
export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending payment",
    "on-hold": "Awaiting payment",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    failed: "Failed",
    "nag-ready-pickup": "Ready for pickup",
  };
  return labels[status] ?? status.replace(/[-_]/g, " ");
}

/** Fetches a customer's own profile by their verified session customer ID — never by a client-supplied ID. */
export async function getCustomerProfile(customerId: string): Promise<AdminApiResult<CustomerProfile>> {
  const result = await wcAdminRequest<WcCustomer>(`/customers/${encodeURIComponent(customerId)}`);
  if (!result.ok) return result;
  const c = result.data;
  return {
    ok: true,
    data: {
      id: String(c.id),
      email: c.email,
      firstName: c.first_name,
      lastName: c.last_name,
      billing: mapAddress(c.billing),
      shipping: mapAddress(c.shipping),
      salonName: metaValue(c.meta_data, CUSTOMER_META_KEYS.salonName),
      certificationOnFile: Boolean(metaValue(c.meta_data, CUSTOMER_META_KEYS.certification)),
    },
  };
}

/** Fetches only the given customer's own orders (server-side `customer` filter — WooCommerce never returns another customer's orders for this query). */
export async function getCustomerOrders(customerId: string): Promise<AdminApiResult<OrderSummary[]>> {
  const result = await wcAdminRequest<WcOrder[]>("/orders", { customer: customerId, per_page: "50", orderby: "date", order: "desc" });
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.map((o) => ({ id: String(o.id), number: o.number, date: o.date_created, status: o.status, total: o.total })),
  };
}

/**
 * Fetches one order by ID, but ONLY returns it if `customer_id` on the
 * order matches the given (session-derived) customerId — this is the
 * ownership check the whole route depends on. A mismatch or a genuinely
 * missing order both come back as `not_found`, deliberately
 * indistinguishable to the caller, so a guessed order ID for someone
 * else's order can't be used to probe which IDs are real.
 */
export async function getCustomerOrder(customerId: string, orderId: string): Promise<AdminApiResult<OrderDetail>> {
  const result = await wcAdminRequest<WcOrder>(`/orders/${encodeURIComponent(orderId)}`);
  if (!result.ok) return result;
  if (String(result.data.customer_id) !== customerId) return { ok: false, reason: "not_found" };

  const o = result.data;
  const shippingLines = (o.shipping_lines ?? []).map((line) => ({ methodId: line.method_id, title: line.method_title, total: line.total }));
  // Line totals are post-discount; adding the discount back gives the pre-discount subtotal.
  const subtotal = o.line_items.reduce((sum, li) => sum + (Number.parseFloat(li.total) || 0), 0) + (Number.parseFloat(o.discount_total ?? "0") || 0);
  const courseTitle = metaValue(o.meta_data, "_nag_course_title");
  const paymentType = metaValue(o.meta_data, "_nag_payment_type");

  return {
    ok: true,
    data: {
      id: String(o.id),
      number: o.number,
      date: o.date_created,
      status: o.status,
      total: o.total,
      items: o.line_items.map((li) => ({
        name: li.name,
        quantity: li.quantity,
        total: li.total,
        options: (li.meta_data ?? [])
          .filter((m) => typeof m.key === "string" && !m.key.startsWith("_") && typeof m.display_value === "string")
          .map((m) => `${m.display_key ?? m.key}: ${String(m.display_value)}`),
      })),
      billing: mapAddress(o.billing),
      shipping: mapAddress(o.shipping),
      paymentMethod: o.payment_method ?? "",
      paymentMethodTitle: o.payment_method_title ?? "",
      shippingMethods: shippingLines,
      isLocalPickup: shippingLines.some((line) => LOCAL_PICKUP_METHOD_IDS.has(line.methodId)),
      pickupReady: o.status === "nag-ready-pickup" || Boolean(metaValue(o.meta_data, "_nag_pickup_ready_emailed_at")),
      subtotal: subtotal.toFixed(2),
      discountTotal: o.discount_total ?? "0",
      shippingTotal: o.shipping_total ?? "0",
      totalTax: o.total_tax ?? "0",
      customerNote: o.customer_note ?? "",
      coupons: (o.coupon_lines ?? []).map((c) => c.code),
      course:
        courseTitle && (paymentType === "full" || paymentType === "deposit")
          ? {
              title: courseTitle,
              paymentType,
              coursePrice: metaValue(o.meta_data, "_nag_course_price") ?? "",
              amountDue: metaValue(o.meta_data, "_nag_amount_due_now") ?? o.total,
              remainingBalance: metaValue(o.meta_data, "_nag_remaining_balance") ?? "0",
            }
          : undefined,
    },
  };
}

function toWcAddress(address: Address): WcAddress {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company,
    address_1: address.addressLine1,
    address_2: address.addressLine2,
    city: address.city,
    state: address.province,
    postcode: address.postalCode,
    country: address.country,
    phone: address.phone,
  };
}

export interface DetailsUpdate {
  firstName: string;
  lastName: string;
  phone: string;
  salonName: string;
}

/** Updates the customer's own name, phone and salon name. Email stays read-only (changing it would bypass email verification). The certification document is set at registration and reviewed by an administrator — it can't be replaced from here. */
export async function updateCustomerDetails(customerId: string, update: DetailsUpdate): Promise<AdminApiResult<true>> {
  const result = await wcAdminRequest<WcCustomer>(
    `/customers/${encodeURIComponent(customerId)}`,
    {},
    {
      method: "PUT",
      body: {
        first_name: update.firstName,
        last_name: update.lastName,
        billing: { phone: update.phone },
        meta_data: [{ key: CUSTOMER_META_KEYS.salonName, value: update.salonName }],
      },
    }
  );
  if (!result.ok) return result;
  return { ok: true, data: true };
}

export interface AddressesUpdate {
  billing: Address;
  shipping: Address;
}

/** Updates the customer's own billing and shipping addresses. */
export async function updateCustomerAddresses(customerId: string, update: AddressesUpdate): Promise<AdminApiResult<true>> {
  const result = await wcAdminRequest<WcCustomer>(
    `/customers/${encodeURIComponent(customerId)}`,
    {},
    { method: "PUT", body: { billing: toWcAddress(update.billing), shipping: toWcAddress(update.shipping) } }
  );
  if (!result.ok) return result;
  return { ok: true, data: true };
}
