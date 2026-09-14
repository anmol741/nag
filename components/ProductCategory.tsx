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
        {/* WooCommerce's per-category `count` only reflects products
            assigned directly to that term — it undercounts parent
            categories whose products actually live in a child category
            (e.g. Waxing showed "48" here but the category page, which
            queries live, correctly returns 92 including subcategories).
            Rather than show a misleading direct-only number, this card
            shows no count; the real, query-derived total appears on the
            category page itself. */}
        {category.description && <p className="mt-1 text-sm text-ink/60">{category.description}</p>}
      </div>
    </div>
  );
}
