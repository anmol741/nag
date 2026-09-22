"use client";

// Cross-tree open/closed state for the header's MiniCart panel — not
// persisted (it's a transient UI flag, not data), so a plain in-memory
// pub-sub is enough. Lets ProductDetail's "Add to Cart" open the panel that
// lives inside Header, without prop-drilling across the layout.

import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((callback) => callback());
}

export function openMiniCart() {
  isOpen = true;
  notify();
}

export function closeMiniCart() {
  isOpen = false;
  notify();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getServerSnapshot() {
  return false;
}

export function useMiniCartOpen(): boolean {
  return useSyncExternalStore(subscribe, () => isOpen, getServerSnapshot);
}
