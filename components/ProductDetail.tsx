"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/product";
import ProductGallery from "./ProductGallery";
import StockStatus from "./StockStatus";
import QuantitySelector from "./QuantitySelector";
import WishlistButton from "./WishlistButton";
import CompareButton from "./CompareButton";

export default function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stockStatus === "out-of-stock";
  const needsOptions = Boolean(product.hasOptions) && (!product.variations || product.variations.length === 0);

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery main={product.image} gallery={product.gallery} />

      <div>
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.categories.map((name) => (
              <span
                key={name}
                className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <h1 className="mt-3 font-display text-3xl text-ink">{product.name}</h1>
        {product.sku && <p className="mt-1 text-xs text-ink/40">SKU: {product.sku}</p>}

        <div className="mt-4 flex items-center gap-3">
          {product.salePrice ? (
            <>
              <span className="font-display text-2xl text-ink">{product.salePrice}</span>
              <span className="text-ink/40 line-through">{product.price}</span>
            </>
          ) : (
            <span className="font-display text-2xl text-ink">{product.price}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StockStatus status={product.stockStatus} />
          {product.stockMessage && <span className="text-sm text-ink/50">{product.stockMessage}</span>}
        </div>

        {product.shortDescriptionHtml && (
          <div
            className="prose-policy mt-6 text-ink/70 [&_a]:text-gold-dark [&_a]:underline [&_p]:mt-0"
            dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
          />
        )}

        {product.attributes && product.attributes.length > 0 && (
          <dl className="mt-6 divide-y divide-ink/10 border-y border-ink/10 text-sm">
            {product.attributes.map((attr) => (
              <div key={attr.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                <dt className="w-32 shrink-0 font-medium text-ink">{attr.name}</dt>
                <dd className="text-ink/70">{attr.options.join(", ")}</dd>
              </div>
            ))}
          </dl>
        )}

        {needsOptions && (
          <p className="mt-6 rounded-md border border-dashed border-gold-dark/40 bg-cream p-4 text-sm text-ink/70">
            This product has selectable options. Please call {" "}
            <a href="tel:+17782787727" className="text-gold-dark hover:underline">
              (778) 278-7727
            </a>{" "}
            or contact us to confirm availability before ordering.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <QuantitySelector value={quantity} onChange={setQuantity} disabled={outOfStock} />
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Online cart and checkout are coming soon"
            className="cursor-not-allowed rounded-md bg-ink/10 px-6 py-3 text-sm font-semibold text-ink/40"
          >
            Add to Cart — Coming Soon
          </button>
          <WishlistButton productId={product.id} />
          <CompareButton productId={product.id} />
        </div>
        <p className="mt-2 text-xs text-ink/50">
          Online cart and checkout integration is not live yet. To order, call{" "}
          <a href="tel:+17782787727" className="text-gold-dark hover:underline">
            (778) 278-7727
          </a>{" "}
          or visit our Langley storefront.
        </p>

        {product.tags && product.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-md border border-ink/10 bg-cream p-4 text-sm text-ink/60">
          Shipping calculated at checkout once ordering is live. Local pickup available at our
          Langley storefront. See our{" "}
          <Link href="/shipping-policy" className="text-gold-dark hover:underline">
            Shipping Policy
          </Link>
          .
        </div>

        {product.descriptionHtml && (
          <div className="mt-10 border-t border-ink/10 pt-8">
            <h2 className="font-display text-xl text-ink">Description</h2>
            <div
              className="prose-policy mt-3 space-y-3 text-ink/70 [&_a]:text-gold-dark [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
