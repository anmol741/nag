import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product";
import StockStatus from "./StockStatus";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-cream">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <WishlistButton productId={product.id} className="absolute right-3 top-3 bg-white/90" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
          {product.category}
        </span>
        <h3 className="mt-3 font-display text-base leading-snug text-ink group-hover:text-gold-dark">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/60">{product.shortDescription}</p>
        <div className="mt-3 flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="font-semibold text-ink">{product.salePrice}</span>
              <span className="text-sm text-ink/40 line-through">{product.price}</span>
            </>
          ) : (
            <span className="font-semibold text-ink">{product.price}</span>
          )}
        </div>
        <div className="mt-3">
          <StockStatus status={product.stockStatus} />
        </div>
      </div>
    </Link>
  );
}
