import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/woocommerce";
import { getSiteUrl } from "@/lib/site-url";
import ProductDetail from "@/components/ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";

// Products are fetched live (and cached for 5 minutes — see lib/woocommerce.ts)
// rather than pre-generated at build time, since this catalogue holds
// hundreds of products and changes independently of this app's deploys.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription || product.name,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.name,
      images: [{ url: product.image.src }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, 4);
  const shareUrl = `${getSiteUrl()}/products/${product.slug}`;

  return (
    <>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              ...(product.category && product.primaryCategorySlug
                ? [{ label: product.category, href: `/shop/category/${product.primaryCategorySlug}` }]
                : []),
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

          <div className="mt-12 border-t border-ink/10 pt-10">
            <h2 className="font-display text-2xl text-ink">Reviews</h2>
            {product.reviews && product.reviews.count > 0 ? (
              <p className="mt-3 text-sm text-ink/70">
                {product.reviews.averageRating.toFixed(1)} out of 5 ({product.reviews.count} review
                {product.reviews.count === 1 ? "" : "s"})
              </p>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-ink/15 bg-cream p-6 text-sm text-ink/60">
                No reviews yet.
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
