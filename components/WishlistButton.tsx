"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, readArray, subscribe, writeArray } from "@/lib/local-store";
import { HeartIcon } from "./icons";

const STORAGE_KEY = "nagsbeauty:wishlist";

function subscribeWishlist(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

function readWishlist(): string[] {
  return readArray<string>(STORAGE_KEY);
}

/**
 * Client-side wishlist toggle backed by localStorage. There is no customer
 * account system yet, so this is per-browser only; swap in a real
 * account-linked wishlist once WooCommerce customer auth is connected.
 */
export default function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const wishlist = useSyncExternalStore(subscribeWishlist, readWishlist, getServerSnapshot<string>);
  const saved = wishlist.includes(productId);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    writeArray(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`inline-flex items-center justify-center rounded-full border border-ink/15 p-2 transition-colors hover:border-gold ${className}`}
    >
      <HeartIcon className={`h-5 w-5 ${saved ? "fill-gold text-gold-dark" : "text-ink/60"}`} />
    </button>
  );
}
