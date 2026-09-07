"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { productCategories } from "@/lib/product";

const stockOptions = [
  { value: "in-stock", label: "In Stock" },
  { value: "backorder", label: "Available on Backorder" },
];

/**
 * Structural filter sidebar for future WooCommerce product listings
 * (category, stock status, price range). Reads/writes the URL query string
 * so filters are shareable and back/forward-navigable, matching
 * CourseFilterGrid's pattern.
 */
export default function ProductFilters({ activeCategorySlug }: { activeCategorySlug?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStock = searchParams.getAll("stock");

  function toggleStock(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("stock");
    params.delete("stock");
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => params.append("stock", v));
    } else {
      [...current, value].forEach((v) => params.append("stock", v));
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Category</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {productCategories.map((cat) => (
            <li key={cat.slug}>
              <a
                href={`/shop/category/${cat.slug}`}
                aria-current={activeCategorySlug === cat.slug ? "page" : undefined}
                className={`hover:text-gold-dark ${
                  activeCategorySlug === cat.slug ? "font-semibold text-gold-dark" : "text-ink/70"
                }`}
              >
                {cat.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Availability</h3>
        <ul className="mt-3 space-y-2">
          {stockOptions.map((opt) => (
            <li key={opt.value}>
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={activeStock.includes(opt.value)}
                  onChange={() => toggleStock(opt.value)}
                  className="h-4 w-4 rounded border-ink/20 text-gold focus:ring-gold"
                />
                {opt.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
