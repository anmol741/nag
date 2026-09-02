import Image from "next/image";
import type { Product } from "@/lib/product";

const stockLabels: Record<Product["stockStatus"], string> = {
  "in-stock": "In Stock",
  "out-of-stock": "Out of Stock",
  backorder: "Available on Backorder",
};

export default function ProductDetail({ product }: { product: Product }) {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
      <div>
        <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
          {product.category}
        </span>
        <h1 className="mt-3 font-display text-3xl text-ink">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          {product.salePrice ? (
            <>
              <span className="font-display text-2xl text-ink">{product.salePrice}</span>
              <span className="text-ink/40 line-through">{product.price}</span>
            </>
          ) : (
            <span className="font-display text-2xl text-ink">{product.price}</span>
          )}
        </div>
        <p className="mt-2 text-sm font-medium text-ink/60">{stockLabels[product.stockStatus]}</p>
        <p className="mt-6 text-ink/70">{product.shortDescription}</p>
      </div>
    </div>
  );
}
