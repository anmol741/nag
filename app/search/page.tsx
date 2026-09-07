import type { Metadata } from "next";
import { Suspense } from "react";
import { business } from "@/lib/site-config";
import { searchProducts } from "@/lib/product";
import ProductSearch from "@/components/ProductSearch";
import ProductGridPaginated from "@/components/ProductGridPaginated";
import EmptyState from "@/components/EmptyState";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 24;

export const metadata: Metadata = { title: "Search Products" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? searchProducts(q) : [];

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
            results.length > 0 ? (
              <>
                <p className="text-sm text-ink/50">
                  {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
                </p>
                <div className="mt-6">
                  <ProductGridPaginated products={results} pageSize={PAGE_SIZE} />
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-lg rounded-xl border border-dashed border-ink/15 bg-cream p-10">
                <EmptyState
                  icon={SearchIcon}
                  title={`No results for "${q}"`}
                  description={`Our online catalog is still being brought online, so search results are limited right now. Call ${business.phone} or contact us for wholesale ordering.`}
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
