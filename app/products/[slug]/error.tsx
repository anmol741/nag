"use client";

import ProductCatalogError from "@/components/ProductCatalogError";

export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ProductCatalogError error={error} reset={reset} />;
}
