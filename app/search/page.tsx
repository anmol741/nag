import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/lib/site-config";
import { searchProducts } from "@/lib/product";
import ProductSearch from "@/components/ProductSearch";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = { title: "Search Products" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? searchProducts(q) : [];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Shop Online</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Search Products</h1>
        <div className="mx-auto mt-8 max-w-md">
          <ProductSearch initialQuery={q} variant="light" />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-6">
        {q ? (
          results.length > 0 ? (
            <>
              <p className="text-sm text-ink/50">
                {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
              </p>
              <div className="mt-6">
                <ProductGrid products={results} />
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-lg rounded-xl border border-dashed border-ink/15 bg-cream p-10 text-center">
              <h2 className="font-display text-xl text-ink">No results for &ldquo;{q}&rdquo;</h2>
              <p className="mt-2 text-sm text-ink/60">
                Our online catalog is still being brought online, so search results are limited
                right now. Call {business.phone} or{" "}
                <Link href="/contact" className="text-gold-dark hover:underline">
                  contact us
                </Link>{" "}
                for wholesale ordering.
              </p>
            </div>
          )
        ) : (
          <p className="text-center text-sm text-ink/50">Enter a search term to find products.</p>
        )}
      </div>
    </section>
  );
}
