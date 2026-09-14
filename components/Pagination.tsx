"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Windows a long page list down to first/last + a run around the current page, with "…" gaps — keeps the control usable when a WooCommerce listing spans dozens of pages. */
function buildPageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("gap");
    result.push(page);
    previous = page;
  }
  return result;
}

/**
 * URL-driven pagination for WooCommerce product listings. Reads/writes a
 * `page` query param (preserving every other param already on the URL, so
 * search/category/sort survive page changes) and renders nothing for a
 * single page.
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

  const pageWindow = buildPageWindow(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-ink/15 px-3 py-2 text-sm text-ink disabled:opacity-30 hover:border-gold"
      >
        Previous
      </button>
      {pageWindow.map((page, i) =>
        page === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-sm text-ink/40">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goTo(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
            className={`h-9 w-9 shrink-0 rounded-md text-sm font-medium ${
              page === currentPage ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5"
            }`}
          >
            {page}
          </button>
        )
      )}
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
