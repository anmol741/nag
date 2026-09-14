"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductCategoryData } from "@/lib/product";

const stockOptions: { value: "in-stock" | "backorder"; label: string }[] = [
  { value: "in-stock", label: "In Stock" },
  { value: "backorder", label: "Available on Backorder" },
];

/**
 * Category + availability sidebar for WooCommerce product listings. Reads/
 * writes the URL query string so filters are shareable and back/forward-
 * navigable. Categories are passed in (fetched server-side) rather than
 * imported statically, and are rendered as a parent/child tree to preserve
 * WooCommerce's category hierarchy.
 */
export default function ProductFilters({
  categories,
  activeCategorySlug,
}: {
  categories: ProductCategoryData[];
  activeCategorySlug?: string;
}) {
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
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const topLevel = categories.filter((c) => c.parentId === null);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Category</h3>
        <ul className="mt-3 space-y-1 text-sm">
          {topLevel.map((cat) => {
            const children = childrenOf(cat.id);
            return (
              <li key={cat.slug}>
                <Link
                  href={`/shop/category/${cat.slug}`}
                  aria-current={activeCategorySlug === cat.slug ? "page" : undefined}
                  className={`block py-1 hover:text-gold-dark ${
                    activeCategorySlug === cat.slug ? "font-semibold text-gold-dark" : "text-ink/70"
                  }`}
                >
                  {cat.name}
                </Link>
                {children.length > 0 && (
                  <ul className="ml-3 space-y-1 border-l border-ink/10 pl-3">
                    {children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/shop/category/${child.slug}`}
                          aria-current={activeCategorySlug === child.slug ? "page" : undefined}
                          className={`block py-0.5 text-sm hover:text-gold-dark ${
                            activeCategorySlug === child.slug ? "font-semibold text-gold-dark" : "text-ink/60"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
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
