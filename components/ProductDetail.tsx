"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/product";
import { addToCart } from "@/lib/cart";
import { openMiniCart } from "@/lib/mini-cart";
import ProductGallery from "./ProductGallery";
import StockStatus from "./StockStatus";
import QuantitySelector from "./QuantitySelector";
import WishlistButton from "./WishlistButton";
import CompareButton from "./CompareButton";

export default function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const outOfStock = product.stockStatus === "out-of-stock";
  // Variable products need an attribute/variation selector this store's
  // catalogue currently has none of (see lib/woocommerce.ts) — until real
  // variation data exists to build one against, purchasing stays routed to
  // a phone call instead of guessing at options.
  const needsOptions = Boolean(product.hasOptions) && (!product.variations || product.variations.length === 0);
  const canAddToCart = product.type === "simple" && !outOfStock && product.hasValidPrice && !needsOptions;
  const stockLimit = product.stockQuantity;

  function handleAddToCart() {
    if (!canAddToCart) return;
    const result = addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: { src: product.image.src, alt: product.image.alt },
        price: Number.parseFloat((product.salePrice ?? product.price).replace(/[^0-9.]/g, "")) || 0,
        stockLimit,
      },
      quantity
    );
    setAddedMessage(
      result.added > 0
        ? result.clamped
          ? `Added ${result.added} × ${product.name} to your cart (limited by available stock).`
          : `Added ${result.added} × ${product.name} to your cart.`
        : `${product.name} is already at the maximum available quantity in your cart.`
    );
    openMiniCart();
    setQuantity(1);
  }

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
          <QuantitySelector value={quantity} onChange={setQuantity} max={stockLimit} disabled={!canAddToCart} />
          <button
            type="button"
            onClick={canAddToCart ? handleAddToCart : undefined}
            disabled={!canAddToCart}
            aria-disabled={!canAddToCart}
            title={
              outOfStock
                ? "This product is currently out of stock"
                : !product.hasValidPrice
                  ? "This product's price needs to be confirmed before it can be ordered — please contact us"
                  : needsOptions
                    ? "This product has selectable options — please call to order"
                    : undefined
            }
            className={
              canAddToCart
                ? "rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
                : "cursor-not-allowed rounded-md bg-ink/10 px-6 py-3 text-sm font-semibold text-ink/40"
            }
          >
            {outOfStock ? "Out of Stock" : !product.hasValidPrice ? "Contact for Price" : "Add to Cart"}
          </button>
          <WishlistButton productId={product.id} />
          <CompareButton productId={product.id} />
        </div>

        {addedMessage && (
          <p role="status" aria-live="polite" className="mt-3 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-ink">
            {addedMessage}
          </p>
        )}

        <p className="mt-2 text-xs text-ink/50">
          {canAddToCart ? (
            <>
              Online checkout is being finalized. To complete an order now, call{" "}
              <a href="tel:+17782787727" className="text-gold-dark hover:underline">
                (778) 278-7727
              </a>{" "}
              or visit our Langley storefront.
            </>
          ) : !product.hasValidPrice ? (
            <>
              This product&rsquo;s price hasn&rsquo;t been set yet. Please call{" "}
              <a href="tel:+17782787727" className="text-gold-dark hover:underline">
                (778) 278-7727
              </a>{" "}
              to confirm pricing and availability.
            </>
          ) : outOfStock ? (
            <>
              This product is currently out of stock. Please call{" "}
              <a href="tel:+17782787727" className="text-gold-dark hover:underline">
                (778) 278-7727
              </a>{" "}
              to ask about availability.
            </>
          ) : null}
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
