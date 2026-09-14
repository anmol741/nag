import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { business } from "@/lib/site-config";
import { getProductCategories, getProductsByCategory, resolveSort, resolveStockStatus } from "@/lib/woocommerce";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import ProductFilters from "@/components/ProductFilters";
import ProductSort from "@/components/ProductSort";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import SmartImage from "@/components/SmartImage";
import { BoxIcon } from "@/components/icons";

const PAGE_SIZE = 24;

// Categories are fetched live rather than pre-generated at build time — see
// lib/woocommerce.ts for the 5-minute request cache.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getProductCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description || `Shop ${category.name} wholesale beauty supplies from ${business.name}.`,
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; stock?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const stockValues = Array.isArray(sp.stock) ? sp.stock : sp.stock ? [sp.stock] : [];
  const { orderby, order } = resolveSort(sp.sort);

  const [categories, result] = await Promise.all([
    getProductCategories(),
    getProductsByCategory(slug, {
      page,
      perPage: PAGE_SIZE,
      orderby,
      order,
      stockStatus: resolveStockStatus(stockValues),
    }),
  ]);

  if (!result.category) notFound();
  const { category, products, total, totalPages } = result;

  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">Shop Online</p>
          <h1 className="mt-4 font-display text-4xl">{category.name}</h1>
          {category.description && (
            <p className="mx-auto mt-3 max-w-2xl text-white/70">{category.description}</p>
          )}
        </div>
      </section>

      {category.image && (
        <div className="border-b border-ink/10 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <SmartImage
              src={category.image.src}
              alt={category.image.alt}
              fit="contain"
              containerClassName="h-48 w-full rounded-lg"
              bgClassName="bg-cream"
              sizes="768px"
            />
          </div>
        </div>
      )}

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name }]}
          />
          {
            <div className="mt-6 grid gap-10 md:grid-cols-[220px_1fr]">
              <ProductFilters categories={categories} activeCategorySlug={slug} />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-ink/50">
                    {total === 0
                      ? `No products found in ${category.name}`
                      : `Showing ${products.length} of ${total} product${total === 1 ? "" : "s"} in ${category.name}`}
                  </p>
                  <ProductSort />
                </div>
                <div className="mt-6">
                  {products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-10">
                      <EmptyState
                        icon={BoxIcon}
                        title="No Products Found"
                        description={`No products currently match these filters in ${category.name.toLowerCase()}. Call ${business.phone} or visit our Langley storefront.`}
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
          }
        </div>
      </section>
    </>
  );
}
