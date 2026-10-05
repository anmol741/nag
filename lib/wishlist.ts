"use client";

// Wishlist storage + account sync.
//
// Guests: the wishlist lives only in this browser's localStorage (as before).
// Logged-in customers: the WooCommerce account (user meta, via the bridge
// plugin) is the source of truth, and localStorage is a mirror the UI
// renders from, so WishlistButton/WishlistPageClient work unchanged.
//
// Sync rules:
// - First sync after a login: MERGE — the guest list is unioned into the
//   account list (no duplicates), so nothing saved as a guest is lost.
// - Every later page load: REPLACE local with the account list, so an
//   item removed on another device doesn't get resurrected.
// - Local changes while logged in are pushed (debounced) as a full list.
// - Logout clears the local mirror, so the next person on a shared
//   computer doesn't see the customer's wishlist.

import { useEffect, useRef } from "react";
import { readArray, subscribe, writeArray } from "./local-store";

export const WISHLIST_STORAGE_KEY = "nagsbeauty:wishlist";
const SYNC_STATE_KEY = "nagsbeauty:wishlist-sync";
const PUSH_DEBOUNCE_MS = 600;
export const MAX_WISHLIST_ITEMS = 200;

function readSyncState(): string | null {
  try {
    return window.localStorage.getItem(SYNC_STATE_KEY);
  } catch {
    return null;
  }
}

function writeSyncState(value: "merge" | "synced" | null) {
  try {
    if (value === null) window.localStorage.removeItem(SYNC_STATE_KEY);
    else window.localStorage.setItem(SYNC_STATE_KEY, value);
  } catch {
    // localStorage unavailable — sync simply re-merges next time.
  }
}

/** Call right after a successful login, before navigating. */
export function markWishlistMergePending() {
  writeSyncState("merge");
}

/** Call on logout. The account copy is safe on the server. */
export function clearWishlistMirror() {
  writeSyncState(null);
  writeArray<string>(WISHLIST_STORAGE_KEY, []);
}

function cleanIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(String).filter((id) => /^[1-9]\d{0,11}$/.test(id)))].slice(0, MAX_WISHLIST_ITEMS);
}

/** Mount once (Header does) with the current logged-in state. */
export function useWishlistSync(loggedIn: boolean) {
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function initialSync() {
      const mode = readSyncState() === "merge" ? "merge" : "replace";
      try {
        const res =
          mode === "merge"
            ? await fetch("/api/account/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: cleanIds(readArray<string>(WISHLIST_STORAGE_KEY)) }),
              })
            : await fetch("/api/account/wishlist", { cache: "no-store" });
        if (res.status === 401) {
          writeSyncState(null);
          return;
        }
        if (!res.ok) return; // keep local list; try again next page load
        const data = (await res.json()) as { ids?: unknown };
        if (cancelled) return;
        const ids = cleanIds(data.ids);
        lastSynced.current = JSON.stringify(ids);
        writeArray(WISHLIST_STORAGE_KEY, ids);
        writeSyncState("synced");
      } catch {
        // Network error — local list stays as-is.
      }
    }

    function pushIfChanged() {
      if (lastSynced.current === null) return; // initial sync hasn't completed
      const ids = cleanIds(readArray<string>(WISHLIST_STORAGE_KEY));
      const serialized = JSON.stringify(ids);
      if (serialized === lastSynced.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetch("/api/account/wishlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        })
          .then((res) => {
            if (res.ok) lastSynced.current = serialized;
          })
          .catch(() => undefined);
      }, PUSH_DEBOUNCE_MS);
    }

    initialSync();
    const unsubscribe = subscribe(WISHLIST_STORAGE_KEY, pushIfChanged);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [loggedIn]);
}
