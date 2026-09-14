"use client";

import { readArray, useStoredIds, writeArray } from "@/lib/local-store";
import { HeartIcon } from "./icons";

export const WISHLIST_STORAGE_KEY = "nagsbeauty:wishlist";

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
  const wishlist = useStoredIds(WISHLIST_STORAGE_KEY);
  const saved = wishlist.includes(productId);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readArray<string>(WISHLIST_STORAGE_KEY);
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...new Set([...current, productId])];
    writeArray(WISHLIST_STORAGE_KEY, next);
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
