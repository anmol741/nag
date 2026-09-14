"use client";

import { useEffect } from "react";
import { business } from "@/lib/site-config";
import EmptyState from "./EmptyState";
import { AlertIcon } from "./icons";

/**
 * Shared error-state UI for the shop/category/product/search routes. Used
 * by each route segment's error.tsx — Next.js renders this in place of the
 * page when a server component in that segment throws (e.g. the
 * WooCommerce API is unreachable). Only ever shown WooCommerceApiError's
 * customer-safe message — see lib/woocommerce.ts.
 */
export default function ProductCatalogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[shop] route error:", error);
  }, [error]);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-lg px-6">
        <EmptyState
          headingLevel="h1"
          icon={AlertIcon}
          title="We Couldn't Load This Right Now"
          description={
            error.message ||
            `Something went wrong reaching our product catalog. Please try again, or call ${business.phone} for wholesale ordering.`
          }
          actions={[{ label: "Contact Us", href: "/contact", variant: "secondary" }]}
        />
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  );
}
