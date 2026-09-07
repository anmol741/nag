"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Structural pagination for future WooCommerce product listings. Reads/
 * writes a `page` query param, matching CourseFilterGrid's URL-driven
 * pattern. Renders nothing for a single page.
 */
export default function Pagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(1, Number(searchParams.get("page")) || 1), totalPages);

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-ink/15 px-3 py-2 text-sm text-ink disabled:opacity-30 hover:border-gold"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goTo(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`h-9 w-9 rounded-md text-sm font-medium ${
            page === currentPage ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border border-ink/15 px-3 py-2 text-sm text-ink disabled:opacity-30 hover:border-gold"
      >
        Next
      </button>
    </nav>
  );
}
