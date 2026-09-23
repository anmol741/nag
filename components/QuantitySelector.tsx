"use client";

import { normalizeQuantity } from "@/lib/cart";

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** Real stock ceiling, when WooCommerce provides one — omit (rather than pass an arbitrary number) when there is none, so no limit is invented. */
  max?: number;
  disabled?: boolean;
}) {
  const atMax = max !== undefined && value >= max;

  // Every quantity this component can produce — decrement, increment, and
  // typed input alike — routes through the same normalizeQuantity used by
  // the cart's own add/update functions (lib/cart.ts), so a value entered
  // here can never disagree with what the cart itself will actually store.
  function set(next: number) {
    onChange(normalizeQuantity(next, max));
  }

  return (
    <div className="inline-flex items-center rounded-md border border-ink/15">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => set(value - 1)}
        className="px-3 py-2 text-ink disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        aria-label="Quantity"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => set(e.target.valueAsNumber)}
        className="w-12 border-x border-ink/15 bg-transparent py-2 text-center text-sm outline-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => set(value + 1)}
        className="px-3 py-2 text-ink disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
