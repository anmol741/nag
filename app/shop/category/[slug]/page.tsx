import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { business } from "@/lib/site-config";
import { getProductCategoryBySlug, getProductsByCategory, productCategories } from "@/lib/product";
import ProductGridPaginated from "@/components/ProductGridPaginated";
import ProductFilters from "@/components/ProductFilters";
import ProductSort from "@/components/ProductSort";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BoxIcon } from "@/components/icons";

const PAGE_SIZE = 24;

export function generateStaticParams() {
  return productCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getProductCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Shop ${category.name} wholesale beauty supplies from ${business.name}.`,
  };
}

export default async function ShopCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getProductCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);

  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">Shop Online</p>
          <h1 className="mt-4 font-display text-4xl">{category.name}</h1>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name }]}
          />
          <Suspense fallback={null}>
            <div className="mt-6 grid gap-10 md:grid-cols-[220px_1fr]">
              <ProductFilters activeCategorySlug={slug} />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-ink/50">
                    Showing {products.length} product{products.length === 1 ? "" : "s"} in {category.name}
                  </p>
                  <ProductSort />
                </div>
                <div className="mt-6">
                  {products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-10">
                      <EmptyState
                        icon={BoxIcon}
                        title="Products Coming Soon"
                        description={`Our ${category.name.toLowerCase()} catalog is being brought online. Call ${business.phone} or visit our Langley storefront to order now.`}
                      />
                    </div>
                  ) : (
                    <ProductGridPaginated products={products} pageSize={PAGE_SIZE} />
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
