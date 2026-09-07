import type { StockStatus as StockStatusValue } from "@/lib/product";

const styles: Record<StockStatusValue, { label: string; className: string }> = {
  "in-stock": { label: "In Stock", className: "bg-green-50 text-green-700" },
  "out-of-stock": { label: "Out of Stock", className: "bg-ink/10 text-ink/50" },
  backorder: { label: "Available on Backorder", className: "bg-gold/10 text-gold-dark" },
};

export default function StockStatus({ status }: { status: StockStatusValue }) {
  const style = styles[status];
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}
