"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/product";
import { readArray, useStoredIds, writeArray } from "@/lib/local-store";
import { COMPARE_STORAGE_KEY, MAX_COMPARE } from "@/components/CompareButton";
import StockStatus from "@/components/StockStatus";
import EmptyState from "@/components/EmptyState";
import { AlertIcon, CompareIcon } from "@/components/icons";

type LoadState = "loading" | "ready" | "error";

/**
 * Compare IDs live in localStorage (see CompareButton), so resolving them to
 * real product data has to happen client-side, via the same /api/products
 * proxy the wishlist page uses (see app/api/products/route.ts).
 */
export default function ComparePageClient() {
  const rawCompareIds = useStoredIds(COMPARE_STORAGE_KEY);
  // Defensive: enforce the cap and de-duplicate even if localStorage was
  // edited by hand or holds stale data from before these limits existed.
  const compareIds = [...new Set(rawCompareIds)].slice(0, MAX_COMPARE);

  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    // Nothing saved — render the empty state directly below; no fetch needed.
    if (compareIds.length === 0) return;

    // Not resetting to "loading" here on purpose: a later re-run (e.g. an
    // item added/removed elsewhere) should keep showing the current list
    // until the refetch resolves, rather than flashing a skeleton.
    let cancelled = false;

    fetch(`/api/products?ids=${compareIds.join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json() as Promise<{ products: Product[] }>;
      })
      .then(({ products: fetched }) => {
        if (cancelled) return;
        setProducts(fetched);
        setState("ready");

        const foundIds = new Set(fetched.map((p) => p.id));
        const staleIds = compareIds.filter((id) => !foundIds.has(id));
        if (staleIds.length > 0) {
          const staleSet = new Set(staleIds);
          writeArray(
            COMPARE_STORAGE_KEY,
            readArray<string>(COMPARE_STORAGE_KEY).filter((id) => !staleSet.has(id))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareIds.join(",")]);

  function removeOne(id: string) {
    writeArray(COMPARE_STORAGE_KEY, readArray<string>(COMPARE_STORAGE_KEY).filter((existing) => existing !== id));
  }

  function clearAll() {
    writeArray(COMPARE_STORAGE_KEY, []);
  }

  if (compareIds.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={CompareIcon}
            title="Nothing to Compare Yet"
            description="Add products to compare from the shop — look for the compare icon on a product card or detail page."
            actions={[
              { label: "Shop Online", href: "/shop" },
              { label: "Contact Us", href: "/contact", variant: "secondary" },
            ]}
          />
        </div>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-display text-3xl text-ink">Compare Products</h1>
          <div className="mt-8 animate-pulse text-sm text-ink/50">Loading your comparison…</div>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={AlertIcon}
            title="We Couldn't Load Your Comparison"
            description="Something went wrong reaching our product catalog. Please try again shortly."
            actions={[
              { label: "Shop Online", href: "/shop" },
              { label: "Contact Us", href: "/contact", variant: "secondary" },
            ]}
          />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={CompareIcon}
            title="Nothing to Compare Yet"
            description="Add products to compare from the shop — look for the compare icon on a product card or detail page."
            actions={[
              { label: "Shop Online", href: "/shop" },
              { label: "Contact Us", href: "/contact", variant: "secondary" },
            ]}
          />
        </div>
      </section>
    );
  }

  // Union of every attribute name across the compared products, so each
  // shows its own row even when not every product has every attribute.
  const attributeNames = [...new Set(products.flatMap((p) => (p.attributes ?? []).map((a) => a.name)))];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-ink">Compare Products</h1>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-ink/50 hover:text-red-600"
          >
            Clear All
          </button>
        </div>

        {products.length < 2 && (
          <p className="mt-4 rounded-md border border-dashed border-gold-dark/40 bg-cream p-4 text-sm text-ink/70">
            Add at least one more product to see a side-by-side comparison. You can compare up to{" "}
            {MAX_COMPARE} products at a time.
          </p>
        )}

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <tbody>
              <tr>
                {products.map((p) => (
                  <td key={p.id} className="w-56 max-w-56 border-b border-ink/10 p-4 align-top">
                    {/* max-w-56 on both the cell and the image box: a <table> with
                        default auto layout ignores a <td>'s w-56 once it's the only
                        (or a nearly-only) column and stretches to fill the row —
                        which, combined with aspect-square, blew the product photo
                        up to nearly the full page width when only 1-2 items were
                        left in the comparison. The explicit max-width caps it
                        regardless of how many columns the table currently has. */}
                    <div className="relative aspect-square w-full max-w-56 overflow-hidden rounded-md bg-cream">
                      <Image src={p.image.src} alt={p.image.alt} fill sizes="200px" className="object-contain p-3" />
                    </div>
                    <Link href={`/products/${p.slug}`} className="mt-3 block text-sm font-medium text-ink hover:text-gold-dark">
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeOne(p.id)}
                      className="mt-1 text-xs text-ink/40 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-ink/10 p-4 text-sm font-semibold text-ink">
                    {p.salePrice ?? p.price}
                  </td>
                ))}
              </tr>
              <tr>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-ink/10 p-4">
                    <StockStatus status={p.stockStatus} />
                  </td>
                ))}
              </tr>
              <tr>
                {products.map((p) => (
                  <td key={p.id} className="border-b border-ink/10 p-4 text-sm text-ink/70">
                    {p.categories && p.categories.length > 0 ? p.categories.join(", ") : "—"}
                  </td>
                ))}
              </tr>
              {attributeNames.map((name) => (
                <tr key={name}>
                  {products.map((p) => {
                    const options = p.attributes?.find((a) => a.name === name)?.options;
                    return (
                      <td key={p.id} className="border-b border-ink/10 p-4 text-sm text-ink/70">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-ink/40">{name}</span>
                        {options && options.length > 0 ? options.join(", ") : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-sm text-ink/60">
                    {p.shortDescription || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
