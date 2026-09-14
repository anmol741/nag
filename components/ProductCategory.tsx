import type { ProductCategoryData } from "@/lib/product";
import SmartImage from "./SmartImage";

export default function ProductCategory({ category }: { category: ProductCategoryData }) {
  return (
    <div className="group flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-ink/10 transition-shadow hover:shadow-md">
      <div className="relative h-32 w-full overflow-hidden border-b border-ink/10 bg-cream">
        {category.image && (
          <SmartImage
            src={category.image.src}
            alt={category.image.alt}
            fit="contain"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            containerClassName="h-full w-full"
            bgClassName="bg-cream"
          />
        )}
      </div>
      <div className="px-6 pb-6">
        <h3 className="font-display text-base text-ink">{category.name}</h3>
        {category.count > 0 && (
          <p className="mt-1 text-xs text-ink/50">
            {category.count} product{category.count === 1 ? "" : "s"}
          </p>
        )}
        {category.description && <p className="mt-1 text-sm text-ink/60">{category.description}</p>}
      </div>
    </div>
  );
}
