"use client";

import { readArray, useStoredIds, writeArray } from "@/lib/local-store";
import { CompareIcon } from "./icons";

export const COMPARE_STORAGE_KEY = "nagsbeauty:compare";
export const MAX_COMPARE = 4;

/** Client-side "compare" toggle backed by localStorage, capped at 4 products, deduplicated. */
export default function CompareButton({
  productId,
  className = "",
  variant = "label",
}: {
  productId: string;
  className?: string;
  /** "label" (default) is the full text button used on the product-detail page. "icon" is a compact circular toggle sized to sit on a ProductCard without crowding it. */
  variant?: "label" | "icon";
}) {
  const compareList = useStoredIds(COMPARE_STORAGE_KEY);
  const added = compareList.includes(productId);
  const atLimit = compareList.length >= MAX_COMPARE && !added;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readArray<string>(COMPARE_STORAGE_KEY);
    if (!current.includes(productId) && current.length >= MAX_COMPARE) return;
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...new Set([...current, productId])];
    writeArray(COMPARE_STORAGE_KEY, next);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={atLimit}
        aria-pressed={added}
        aria-label={added ? "Remove from comparison" : "Add to comparison"}
        title={atLimit ? `You can compare up to ${MAX_COMPARE} products` : added ? "Remove from comparison" : "Add to comparison"}
        className={`inline-flex items-center justify-center rounded-full border p-2 transition-colors disabled:opacity-40 ${
          added ? "border-gold bg-gold/10" : "border-ink/15 hover:border-gold"
        } ${className}`}
      >
        <CompareIcon className={`h-5 w-5 ${added ? "text-gold-dark" : "text-ink/60"}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={atLimit}
      aria-pressed={added}
      title={atLimit ? `You can compare up to ${MAX_COMPARE} products` : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
        added ? "border-gold bg-gold/10 text-gold-dark" : "border-ink/15 text-ink/70 hover:border-gold"
      } ${className}`}
    >
      {added ? "Added to Compare" : "Compare"}
    </button>
  );
}
