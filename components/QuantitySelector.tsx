"use client";

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  function clamp(next: number) {
    onChange(Math.min(max, Math.max(min, next)));
  }

  return (
    <div className="inline-flex items-center rounded-md border border-ink/15">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => clamp(value - 1)}
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
        onChange={(e) => clamp(Number(e.target.value) || min)}
        className="w-12 border-x border-ink/15 bg-transparent py-2 text-center text-sm outline-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => clamp(value + 1)}
        className="px-3 py-2 text-ink disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
