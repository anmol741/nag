"use client";

import { useState } from "react";
import type { Product } from "@/lib/product";
import { addToCart } from "@/lib/cart";
import ProductGallery from "./ProductGallery";
import StockStatus from "./StockStatus";
import QuantitySelector from "./QuantitySelector";
import WishlistButton from "./WishlistButton";
import CompareButton from "./CompareButton";

function parsePrice(price: string): number {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockStatus === "out-of-stock";

  function handleAddToCart() {
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: { src: product.image.src, alt: product.image.alt },
        price: parsePrice(product.salePrice ?? product.price),
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery main={product.image} gallery={product.gallery} />

      <div>
        <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
          {product.category}
        </span>
        <h1 className="mt-3 font-display text-3xl text-ink">{product.name}</h1>
        <p className="mt-1 text-xs text-ink/40">SKU: {product.sku}</p>

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

        <div className="mt-3">
          <StockStatus status={product.stockStatus} />
        </div>

        <p className="mt-6 text-ink/70">{product.description ?? product.shortDescription}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <QuantitySelector value={quantity} onChange={setQuantity} disabled={outOfStock} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:opacity-40"
          >
            {added ? "Added ✓" : "Add to Cart"}
          </button>
          <WishlistButton productId={product.id} />
          <CompareButton productId={product.id} />
        </div>

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
          Shipping calculated at checkout. Local pickup available at our Langley storefront.
        </div>
      </div>
    </div>
  );
}
