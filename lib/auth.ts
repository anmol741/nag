"use client";

// Client-side auth session scaffolding. WooCommerce customer authentication
// is NOT connected yet — nothing in this app currently calls `setSession`,
// so `useAuthSession()` always resolves to `null` and /account always
// renders its logged-out state. This is real, working infrastructure (not a
// demo/fake login) so that wiring a real login API later is a small,
// isolated change: call `setSession(...)` once the WooCommerce customer
// login/register endpoints respond successfully.

import { useSyncExternalStore } from "react";
import { readValue, subscribe, writeValue } from "./local-store";

const STORAGE_KEY = "nagsbeauty:auth-session";

export interface AuthSession {
  email: string;
  name?: string;
}

function subscribeAuth(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

function readSession(): AuthSession | null {
  return readValue<AuthSession | null>(STORAGE_KEY, null);
}

function getServerAuthSnapshot(): AuthSession | null {
  return null;
}

/** Reactive hook for the current customer session — `null` until real WooCommerce auth is connected. */
export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(subscribeAuth, readSession, getServerAuthSnapshot);
}

/** Integration point for a future login/register API response. Not called anywhere yet. */
export function setSession(session: AuthSession) {
  writeValue<AuthSession | null>(STORAGE_KEY, session);
}

/**
 * Ends the authenticated session only. Deliberately scoped to the auth key
 * alone — the cart (`nagsbeauty:cart`) and wishlist (`nagsbeauty:wishlist`)
 * use separate localStorage keys and are never touched here, matching
 * WooCommerce's default behavior of preserving cart contents across logout.
 */
export function logout() {
  writeValue<AuthSession | null>(STORAGE_KEY, null);
}
