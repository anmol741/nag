import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, productCategories, products } from "@/lib/product";
import ProductDetail from "@/components/ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";

// No wholesale products are connected yet (see lib/woocommerce.ts), so this
// always resolves to notFound() for now — the full detail structure below
// (gallery, stock, wishlist/compare, related products) is ready to render
// the moment `lib/product.ts` starts returning real WooCommerce data.
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, images: [{ url: product.image.src }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);
  const index = products.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? products[index - 1] : undefined;
  const next = index >= 0 && index < products.length - 1 ? products[index + 1] : undefined;
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/products/${product.slug}`;
  const category = productCategories.find((c) => c.name === product.category);

  return (
    <>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              ...(category ? [{ label: category.name, href: `/shop/category/${category.slug}` }] : []),
              { label: product.name },
            ]}
          />
          <div className="mt-6">
            <ProductDetail product={product} />
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-ink/50">
            <span>Share:</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-dark"
            >
              Facebook
            </a>
            <a
              href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-dark"
            >
              X
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-ink/10 pt-6 text-sm">
            {prev ? (
              <Link href={`/products/${prev.slug}`} className="text-gold-dark hover:underline">
                ← {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/products/${next.slug}`} className="text-gold-dark hover:underline">
                {next.name} →
              </Link>
            )}
          </div>

          <div className="mt-12 border-t border-ink/10 pt-10">
            <h2 className="font-display text-2xl text-ink">Reviews</h2>
            {product.reviews && product.reviews.count > 0 ? (
              <p className="mt-3 text-sm text-ink/70">
                {product.reviews.averageRating.toFixed(1)} out of 5 ({product.reviews.count} review
                {product.reviews.count === 1 ? "" : "s"})
              </p>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-ink/15 bg-cream p-6 text-sm text-ink/60">
                No reviews yet. Reviews will appear here once online ordering is connected.
              </p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-cream py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl text-ink">Related Products</h2>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
