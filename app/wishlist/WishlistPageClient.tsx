"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/product";
import { readArray, useStoredIds, writeArray } from "@/lib/local-store";
import { WISHLIST_STORAGE_KEY } from "@/components/WishlistButton";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import EmptyState from "@/components/EmptyState";
import { AlertIcon, HeartIcon } from "@/components/icons";

type LoadState = "loading" | "ready" | "error";

/**
 * Wishlist IDs live in localStorage (see WishlistButton), so resolving them
 * to real product data has to happen client-side. This fetches
 * /api/products?ids=... (a same-origin proxy in front of the WooCommerce
 * Store API's `include` lookup — see app/api/products/route.ts) rather than
 * calling nagsbeautysupply.com directly, to avoid a cross-origin request.
 */
export default function WishlistPageClient() {
  const wishlistIds = useStoredIds(WISHLIST_STORAGE_KEY);
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    // Nothing saved — render the empty state directly below; no fetch needed.
    if (wishlistIds.length === 0) return;

    // Not resetting to "loading" here on purpose: a later re-run (e.g. an
    // item added/removed elsewhere) should keep showing the current list
    // until the refetch resolves, rather than flashing a skeleton.
    let cancelled = false;

    fetch(`/api/products?ids=${wishlistIds.join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json() as Promise<{ products: Product[] }>;
      })
      .then(({ products: fetched }) => {
        if (cancelled) return;
        setProducts(fetched);
        setState("ready");

        // Any saved ID that didn't come back no longer resolves to a real,
        // available product (deleted or unpublished in WooCommerce) —
        // drop it from storage so it stops showing up as "saved".
        const foundIds = new Set(fetched.map((p) => p.id));
        const staleIds = wishlistIds.filter((id) => !foundIds.has(id));
        if (staleIds.length > 0) {
          const staleSet = new Set(staleIds);
          writeArray(
            WISHLIST_STORAGE_KEY,
            readArray<string>(WISHLIST_STORAGE_KEY).filter((id) => !staleSet.has(id))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [wishlistIds]);

  if (wishlistIds.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={HeartIcon}
            title="Your Wishlist Is Empty"
            description="Save products you're interested in from the shop and they'll appear here."
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-display text-3xl text-ink">Your Wishlist</h1>
          <div className="mt-8">
            <ProductGridSkeleton count={Math.min(wishlistIds.length, 8)} />
          </div>
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
            title="We Couldn't Load Your Wishlist"
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
            icon={HeartIcon}
            title="Your Wishlist Is Empty"
            description="Save products you're interested in from the shop and they'll appear here."
            actions={[
              { label: "Shop Online", href: "/shop" },
              { label: "Contact Us", href: "/contact", variant: "secondary" },
            ]}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="font-display text-3xl text-ink">Your Wishlist</h1>
        <p className="mt-2 text-sm text-ink/50">
          {products.length} saved product{products.length === 1 ? "" : "s"}
        </p>
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </div>
    </section>
  );
}
