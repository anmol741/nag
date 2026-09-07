import type { Product } from "@/lib/product";
import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";
import { BoxIcon } from "./icons";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={BoxIcon}
        title="No Products Yet"
        description="Products will appear here once our online catalog is connected."
        className="py-10"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
