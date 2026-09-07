"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { products, type Product } from "@/lib/product";
import { getServerSnapshot, readArray, subscribe, writeArray } from "@/lib/local-store";
import StockStatus from "@/components/StockStatus";
import EmptyState from "@/components/EmptyState";
import { CompareIcon } from "@/components/icons";

const STORAGE_KEY = "nagsbeauty:compare";

function subscribeCompare(callback: () => void) {
  return subscribe(STORAGE_KEY, callback);
}

function readCompareIds(): string[] {
  return readArray<string>(STORAGE_KEY);
}

export default function ComparePageClient() {
  const compareIds = useSyncExternalStore(subscribeCompare, readCompareIds, getServerSnapshot<string>);
  const compared: Product[] = products.filter((p) => compareIds.includes(p.id));

  if (products.length === 0 || compared.length === 0) {
    return (
      <section className="bg-white py-24">
        <div className="px-6">
          <EmptyState
            headingLevel="h1"
            icon={CompareIcon}
            title="Nothing to Compare Yet"
            description="Add products to compare once our online shop launches. For now, browse categories and contact us to place an order."
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
        <h1 className="font-display text-3xl text-ink">Compare Products</h1>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <tbody>
              <tr>
                {compared.map((p) => (
                  <td key={p.id} className="w-56 border-b border-ink/10 p-4 align-top">
                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-cream">
                      <Image src={p.image.src} alt={p.image.alt} fill sizes="200px" className="object-cover" />
                    </div>
                    <Link href={`/products/${p.slug}`} className="mt-3 block text-sm font-medium text-ink hover:text-gold-dark">
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => writeArray(STORAGE_KEY, compareIds.filter((id) => id !== p.id))}
                      className="mt-1 text-xs text-ink/40 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                {compared.map((p) => (
                  <td key={p.id} className="border-b border-ink/10 p-4 text-sm font-semibold text-ink">
                    {p.salePrice ?? p.price}
                  </td>
                ))}
              </tr>
              <tr>
                {compared.map((p) => (
                  <td key={p.id} className="border-b border-ink/10 p-4">
                    <StockStatus status={p.stockStatus} />
                  </td>
                ))}
              </tr>
              <tr>
                {compared.map((p) => (
                  <td key={p.id} className="p-4 text-sm text-ink/60">
                    {p.shortDescription}
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
