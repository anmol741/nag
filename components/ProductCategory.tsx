import type { ProductCategoryData } from "@/lib/product";
import SmartImage from "./SmartImage";

export default function ProductCategory({ category }: { category: ProductCategoryData }) {
  return (
    <div className="group flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-ink/10 transition-shadow hover:shadow-md">
      {category.image ? (
        <SmartImage
          src={category.image.src}
          alt={category.image.alt}
          fit="contain"
          width={category.image.width}
          height={category.image.height}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          containerClassName="w-full border-b border-ink/10 p-3"
          bgClassName="bg-cream"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gold/10">
          <span className="font-display text-xl text-gold-dark">
            {category.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="px-6 pb-6">
        <h3 className="font-display text-base text-ink">{category.name}</h3>
        {category.description && <p className="mt-1 text-sm text-ink/60">{category.description}</p>}
      </div>
    </div>
  );
}
