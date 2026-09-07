"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, readArray, subscribe, writeArray } from "@/lib/local-store";

const STORAGE_KEY = "nagsbeauty:compare";
const MAX_COMPARE = 4;

function subscribeCompare(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

function readCompare(): string[] {
  return readArray<string>(STORAGE_KEY);
}

/** Client-side "compare" toggle backed by localStorage, capped at 4 products. */
export default function CompareButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const compareList = useSyncExternalStore(subscribeCompare, readCompare, getServerSnapshot<string>);
  const added = compareList.includes(productId);
  const atLimit = compareList.length >= MAX_COMPARE && !added;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readCompare();
    if (!current.includes(productId) && current.length >= MAX_COMPARE) return;
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    writeArray(STORAGE_KEY, next);
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
