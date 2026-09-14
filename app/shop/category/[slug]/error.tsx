"use client";

import ProductCatalogError from "@/components/ProductCatalogError";

export default function ShopCategoryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ProductCatalogError error={error} reset={reset} />;
}
