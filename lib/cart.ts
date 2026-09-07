"use client";

// Client-side cart scaffolding, backed by localStorage. There is no
// WooCommerce cart/checkout connected yet — this exists so cart UI
// (MiniCart, CartItem, CartSummary) has a real, working data source to
// render against ahead of that integration. Swap these functions for
// WooCommerce Store API cart calls once available.

import { useSyncExternalStore } from "react";
import { getServerSnapshot, readArray, subscribe, writeArray } from "./local-store";

const STORAGE_KEY = "nagsbeauty:cart";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: { src: string; alt: string };
  price: number;
  quantity: number;
}

function readCart(): CartLine[] {
  return readArray<CartLine>(STORAGE_KEY);
}

function writeCart(lines: CartLine[]) {
  writeArray(STORAGE_KEY, lines);
}

export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1) {
  const current = readCart();
  const existing = current.find((l) => l.productId === line.productId);
  const next = existing
    ? current.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l))
    : [...current, { ...line, quantity }];
  writeCart(next);
}

export function updateQuantity(productId: string, quantity: number) {
  const current = readCart();
  const next =
    quantity <= 0
      ? current.filter((l) => l.productId !== productId)
      : current.map((l) => (l.productId === productId ? { ...l, quantity } : l));
  writeCart(next);
}

export function removeFromCart(productId: string) {
  writeCart(readCart().filter((l) => l.productId !== productId));
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
