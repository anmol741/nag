import type { Metadata } from "next";
import { Suspense } from "react";
import { business } from "@/lib/site-config";
import { searchProducts, resolveSort } from "@/lib/woocommerce";
import ProductSearch from "@/components/ProductSearch";
import ProductGrid from "@/components/ProductGrid";
import ProductSort from "@/components/ProductSort";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 24;

export const metadata: Metadata = { title: "Search Products" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { orderby, order } = resolveSort(sp.sort);

  const { products, total, totalPages } = q
    ? await searchProducts(q, { page, perPage: PAGE_SIZE, orderby, order })
    : { products: [], total: 0, totalPages: 1 };

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Shop Online</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Search Products</h1>
        <div className="mx-auto mt-8 max-w-md">
          <ProductSearch initialQuery={q} variant="light" />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-6">
        <Suspense fallback={null}>
          {q ? (
            products.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-ink/50">
                    {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
                  </p>
                  <ProductSort />
                </div>
                <div className="mt-6">
                  <ProductGrid products={products} />
                  <Pagination totalPages={totalPages} />
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-lg rounded-xl border border-dashed border-ink/15 bg-cream p-10">
                <EmptyState
                  icon={SearchIcon}
                  title={`No results for "${q}"`}
                  description={`Try a different search term, or call ${business.phone} for help finding a product.`}
                  actions={[{ label: "Contact Us", href: "/contact", variant: "secondary" }]}
                />
              </div>
            )
          ) : (
            <EmptyState
              icon={SearchIcon}
              title="Search Our Catalog"
              description="Enter a search term above to find products."
            />
          )}
        </Suspense>
      </div>
    </section>
  );
}
