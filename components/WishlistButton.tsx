"use client";

import { readArray, useStoredIds, writeArray } from "@/lib/local-store";
import { MAX_WISHLIST_ITEMS, WISHLIST_STORAGE_KEY } from "@/lib/wishlist";
import { HeartIcon } from "./icons";

// Re-exported for existing imports.
export { WISHLIST_STORAGE_KEY };

/**
 * Wishlist toggle backed by localStorage. For guests that's the whole
 * wishlist; for logged-in customers it's a mirror that useWishlistSync
 * (lib/wishlist.ts, mounted by Header) keeps in sync with their account.
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
      : [...new Set([...current, productId])].slice(-MAX_WISHLIST_ITEMS);
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
