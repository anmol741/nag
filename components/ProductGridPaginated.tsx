"use client";

import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/product";
import ProductGrid from "./ProductGrid";
import Pagination from "./Pagination";

/**
 * Client-side page slicing, fed the full result set from the server —
 * mirrors CourseFilterGrid's URL-driven pattern so the parent page stays
 * statically generated instead of opting into per-request rendering just
 * to read a `page` query param.
 */
export default function ProductGridPaginated({ products, pageSize }: { products: Product[]; pageSize: number }) {
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(searchParams.get("page")) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return (
    <>
      <ProductGrid products={products.slice(start, start + pageSize)} />
      <Pagination totalPages={totalPages} />
    </>
  );
}
