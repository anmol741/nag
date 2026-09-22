"use client";

// Client-side cart, backed by localStorage. There is no WooCommerce
// cart/checkout connected yet — this is the frontend-only cart for Phase 1
// (see MiniCart, CartItem, CartSummary, ProductDetail). Swap these functions
// for WooCommerce Store API cart calls once real checkout is built.

import { useSyncExternalStore } from "react";
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
  /** Maximum purchasable quantity, from WooCommerce's live stock quantity — undefined when WooCommerce doesn't expose a number (i.e. the product isn't close to running low), meaning no known ceiling to enforce. */
  stockLimit?: number;
}

function sameLine(a: Pick<CartLine, "productId" | "variationId">, b: Pick<CartLine, "productId" | "variationId">) {
  return a.productId === b.productId && a.variationId === b.variationId;
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

/** Adds a line to the cart, merging into an existing line for the same product+variation instead of duplicating it. Clamps to `line.stockLimit` when provided. */
export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1): AddToCartResult {
  if (quantity < 1) return { added: 0, clamped: false };
  const current = readCart();
  const existing = current.find((l) => sameLine(l, line));
  const limit = line.stockLimit;

  if (existing) {
    const desired = existing.quantity + quantity;
    const finalQuantity = limit !== undefined ? Math.min(desired, limit) : desired;
    writeCart(current.map((l) => (sameLine(l, line) ? { ...l, ...line, quantity: finalQuantity } : l)));
    return { added: finalQuantity - existing.quantity, clamped: finalQuantity < desired };
  }

  const finalQuantity = limit !== undefined ? Math.min(quantity, limit) : quantity;
  writeCart([...current, { ...line, quantity: finalQuantity }]);
  return { added: finalQuantity, clamped: finalQuantity < quantity };
}

/** Updates a line's quantity, clamped to its own stockLimit when set. A quantity of 0 or less removes the line. */
export function updateQuantity(productId: string, quantity: number, variationId?: string) {
  const current = readCart();
  const next = current.flatMap((l) => {
    if (!sameLine(l, { productId, variationId })) return [l];
    if (quantity <= 0) return [];
    const clamped = l.stockLimit !== undefined ? Math.min(quantity, l.stockLimit) : quantity;
    return [{ ...l, quantity: clamped }];
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
  return { lines, ...calculateTotals(lines) };
}
