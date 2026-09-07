"use client";

import { useSyncExternalStore } from "react";
import { products, type Product } from "@/lib/product";
import { getServerSnapshot, readArray, subscribe } from "@/lib/local-store";
import ProductGrid from "@/components/ProductGrid";
import EmptyState from "@/components/EmptyState";
import { HeartIcon } from "@/components/icons";

const STORAGE_KEY = "nagsbeauty:wishlist";

function subscribeWishlist(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

function readWishlistIds(): string[] {
  return readArray<string>(STORAGE_KEY);
}

export default function WishlistPageClient() {
  const wishlistIds = useSyncExternalStore(subscribeWishlist, readWishlistIds, getServerSnapshot<string>);
  const wishlisted: Product[] = products.filter((p) => wishlistIds.includes(p.id));

  if (wishlisted.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={HeartIcon}
            title="Your Wishlist Is Empty"
            description="Save your favorite products once our online shop launches. For now, browse categories and contact us to place an order."
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
        <div className="mt-8">
          <ProductGrid products={wishlisted} />
        </div>
      </div>
    </section>
  );
}
