"use client";

// Client-side cart, backed by localStorage. There is no WooCommerce
// cart/checkout connected yet — this is the frontend-only cart for Phase 1
// (see MiniCart, CartItem, CartSummary, ProductDetail). Swap these functions
// for WooCommerce Store API cart calls once real checkout is built.

import { useEffect, useSyncExternalStore } from "react";
import { getServerSnapshot, readArray, subscribe, writeArray } from "./local-store";

const STORAGE_KEY = "nagsbeauty:cart";

export interface CartLine {
  productId: string;
  /** WooCommerce variation ID, for a variable product — undefined for a simple product. Combined with productId, this is a cart line's identity, so the same product can hold one line per variation. */
  variationId?: string;
  slug: string;
  name: string;
  image: { src: string; alt: string };
  price: number;
  quantity: number;
  /** Selected attributes for a variable product, e.g. { Size: "50ml", Shade: "Ivory" }. */
  attributes?: Record<string, string>;
  /** Maximum purchasable quantity, from WooCommerce's live stock quantity — undefined when WooCommerce doesn't expose a number (i.e. the product isn't stock-quantity-managed), meaning no known ceiling to enforce. */
  stockLimit?: number;
}

function sameLine(a: Pick<CartLine, "productId" | "variationId">, b: Pick<CartLine, "productId" | "variationId">) {
  return a.productId === b.productId && a.variationId === b.variationId;
}

export const MIN_QUANTITY = 1;

/**
 * The single source of truth for a legal cart quantity — every entry point
 * (Add to Cart, the +/- buttons, direct number-input editing, and cart
 * hydration) must route through this so they all enforce the same rule.
 * Rejects NaN, negative and fractional input by flooring to a whole number
 * and clamping to at least MIN_QUANTITY; clamps to `max` when a real stock
 * ceiling is known (undefined `max` means WooCommerce reported no
 * meaningful cap, so only the minimum is enforced).
 */
export function normalizeQuantity(value: number, max?: number): number {
  const whole = Number.isFinite(value) ? Math.floor(value) : MIN_QUANTITY;
  const atLeastMin = Math.max(MIN_QUANTITY, whole);
  return max !== undefined ? Math.min(atLeastMin, max) : atLeastMin;
}

/**
 * Validates one raw, untrusted value read back from localStorage into a
 * real CartLine, or null if it's structurally malformed (wrong types,
 * missing required fields) and should be dropped rather than trusted.
 * A structurally valid line's quantity is clamped to its own *stored*
 * stockLimit — this catches a value like 11 saved before stock-limit
 * enforcement existed, whenever that line's stockLimit was itself already
 * captured correctly. It can't fix a line whose stored stockLimit is
 * itself stale/missing (the original bug this line existed to close) —
 * that requires a live re-check against current WooCommerce data, done
 * separately by useValidateCartStock().
 */
function sanitizeLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<CartLine>;

  if (typeof l.productId !== "string" || !l.productId) return null;
  if (typeof l.slug !== "string" || !l.slug) return null;
  if (typeof l.name !== "string" || !l.name) return null;
  if (!l.image || typeof l.image.src !== "string" || typeof l.image.alt !== "string") return null;
  if (typeof l.price !== "number" || !Number.isFinite(l.price) || l.price < 0) return null;
  if (typeof l.quantity !== "number") return null;

  const stockLimit = typeof l.stockLimit === "number" && Number.isFinite(l.stockLimit) && l.stockLimit >= 0 ? l.stockLimit : undefined;
  const variationId = typeof l.variationId === "string" && l.variationId ? l.variationId : undefined;
  const attributes =
    l.attributes && typeof l.attributes === "object" && !Array.isArray(l.attributes)
      ? (l.attributes as Record<string, string>)
      : undefined;

  return {
    productId: l.productId,
    variationId,
    slug: l.slug,
    name: l.name,
    image: { src: l.image.src, alt: l.image.alt },
    price: l.price,
    quantity: normalizeQuantity(l.quantity, stockLimit),
    attributes,
    stockLimit,
  };
}

function readCart(): CartLine[] {
  return readArray<CartLine>(STORAGE_KEY);
}

function writeCart(lines: CartLine[]) {
  writeArray(STORAGE_KEY, lines);
}

export interface AddToCartResult {
  /** Quantity actually added, after clamping to stockLimit. */
  added: number;
  /** True if the requested quantity was reduced to stay within stockLimit. */
  clamped: boolean;
}

/** Adds a line to the cart, merging into an existing line for the same product+variation instead of duplicating it. Clamps to `line.stockLimit` when provided — the combined quantity (existing + newly requested) never exceeds it. */
export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1): AddToCartResult {
  const requested = normalizeQuantity(quantity);
  const current = readCart();
  const existing = current.find((l) => sameLine(l, line));
  const limit = line.stockLimit;

  if (existing) {
    const desired = existing.quantity + requested;
    const finalQuantity = normalizeQuantity(desired, limit);
    writeCart(current.map((l) => (sameLine(l, line) ? { ...l, ...line, quantity: finalQuantity } : l)));
    return { added: finalQuantity - existing.quantity, clamped: finalQuantity < desired };
  }

  const finalQuantity = normalizeQuantity(requested, limit);
  writeCart([...current, { ...line, quantity: finalQuantity }]);
  return { added: finalQuantity, clamped: finalQuantity < requested };
}

/** Updates a line's quantity, clamped to its own stockLimit when set. A quantity of 0 or less removes the line. */
export function updateQuantity(productId: string, quantity: number, variationId?: string) {
  const current = readCart();
  const next = current.flatMap((l) => {
    if (!sameLine(l, { productId, variationId })) return [l];
    if (quantity <= 0) return [];
    return [{ ...l, quantity: normalizeQuantity(quantity, l.stockLimit) }];
  });
  writeCart(next);
}

export function removeFromCart(productId: string, variationId?: string) {
  writeCart(readCart().filter((l) => !sameLine(l, { productId, variationId })));
}

export function clearCart() {
  writeCart([]);
}

const GST_RATE = 0.05;
const PST_RATE = 0.07;

export function calculateTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const gst = subtotal * GST_RATE;
  const pst = subtotal * PST_RATE;
  return { subtotal, gst, pst, total: subtotal + gst + pst };
}

function subscribeCart(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

/** Reactive hook for cart state; re-reads on same-tab and cross-tab changes. */
export function useCart() {
  const lines = useSyncExternalStore(subscribeCart, readCart, getServerSnapshot<CartLine>);

  // One-time-per-mount hydration cleanup, run as an effect (never inside
  // the getSnapshot path above) so it can't violate useSyncExternalStore's
  // requirement that getSnapshot be a pure, side-effect-free read. Runs
  // after the client's first real render — never during SSR/the initial
  // hydration pass — so it can't cause a server/client mismatch; it only
  // ever *corrects* already-hydrated client state.
  useEffect(() => {
    const raw = readArray<unknown>(STORAGE_KEY);
    const clean = raw.map(sanitizeLine).filter((l): l is CartLine => l !== null);
    const changed = clean.length !== raw.length || JSON.stringify(clean) !== JSON.stringify(raw);
    if (changed) writeCart(clean);
  }, []);

  return { lines, ...calculateTotals(lines) };
}

interface LiveProductStock {
  id: string;
  stockStatus: string;
  stockQuantity?: number;
}

/**
 * Re-validates every cart line against *live* WooCommerce stock, refreshing
 * each line's stored `stockLimit` and clamping its quantity to match. This
 * is what actually repairs a cart line saved before stock-limit enforcement
 * existed (or whose stock has simply changed since it was added) — a
 * stored `stockLimit` on its own can't fix itself if it was wrong or
 * missing to begin with. Mounted once, high in the tree (see MiniCart,
 * always present via Header), so it runs on every page load without every
 * cart-displaying component needing to duplicate it. Never removes a line
 * just because stock changed — only clamps quantity — so a still-valid
 * saved item is never silently deleted.
 */
export function useValidateCartStock() {
  const { lines } = useCart();
  const productIds = [...new Set(lines.map((l) => l.productId))].sort().join(",");

  useEffect(() => {
    if (!productIds) return;
    let cancelled = false;

    fetch(`/api/products?ids=${productIds}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ products: LiveProductStock[] }>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        const liveById = new Map(data.products.map((p) => [p.id, p]));

        const current = readCart();
        let changed = false;
        const next = current.map((line) => {
          const live = liveById.get(line.productId);
          if (!live) return line;
          const liveLimit = typeof live.stockQuantity === "number" ? live.stockQuantity : undefined;
          if (liveLimit === line.stockLimit && normalizeQuantity(line.quantity, liveLimit) === line.quantity) {
            return line;
          }
          changed = true;
          return { ...line, stockLimit: liveLimit, quantity: normalizeQuantity(line.quantity, liveLimit) };
        });

        if (changed) writeCart(next);
      })
      .catch(() => {
        // Best-effort revalidation — a failed request leaves the existing
        // (already-sanitized) cart state untouched rather than clearing it.
      });

    return () => {
      cancelled = true;
    };
  }, [productIds]);
}
