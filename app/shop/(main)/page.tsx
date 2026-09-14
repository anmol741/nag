import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ProductCategory from "@/components/ProductCategory";
import ProductSearch from "@/components/ProductSearch";
import ProductFilters from "@/components/ProductFilters";
import ProductSort from "@/components/ProductSort";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { BoxIcon } from "@/components/icons";
import { getProductCategories, getProducts, resolveSort, resolveStockStatus } from "@/lib/woocommerce";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Shop Online",
  description:
    "Wholesale beauty supplies from Nag's Beauty Supplies & Training Center — facial, waxing, lash & brow, makeup, and medical esthetics products.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; stock?: string | string[] }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const stockValues = Array.isArray(sp.stock) ? sp.stock : sp.stock ? [sp.stock] : [];
  const { orderby, order } = resolveSort(sp.sort);

  const categories = await getProductCategories();
  const topLevelCategories = categories.filter((c) => c.parentId === null);

  const { products, total, totalPages } = await getProducts({
    page,
    perPage: PAGE_SIZE,
    orderby,
    order,
    stockStatus: resolveStockStatus(stockValues),
  });

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart === 0 ? 0 : rangeStart + products.length - 1;

  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
            Wholesale Beauty Supplies
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Shop Online</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Professional-grade supplies for the makeup, spa, and medi-spa industry.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <ProductSearch />
          </div>
        </div>
      </section>

      {topLevelCategories.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-2xl text-ink">Shop by Category</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topLevelCategories.map((cat) => (
                <Link key={cat.slug} href={`/shop/category/${cat.slug}`} className="block">
                  <ProductCategory category={cat} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl text-ink">All Products</h2>
          <Suspense fallback={null}>
            <div className="mt-6 grid gap-10 md:grid-cols-[220px_1fr]">
              <ProductFilters categories={categories} />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-ink/50">
                    {total === 0
                      ? "No products found"
                      : `Showing ${rangeStart}–${rangeEnd} of ${total} product${total === 1 ? "" : "s"}`}
                  </p>
                  <ProductSort />
                </div>
                <div className="mt-6">
                  {products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink/15 bg-white p-10">
                      <EmptyState
                        icon={BoxIcon}
                        title="No Products Found"
                        description="Try a different availability filter, or search for a specific product."
                      />
                    </div>
                  ) : (
                    <>
                      <ProductGrid products={products} />
                      <Pagination totalPages={totalPages} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </Suspense>
        </div>
      </section>
    </>
  );
}
