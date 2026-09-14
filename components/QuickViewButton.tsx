"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product";
import { getCurrentPrice } from "@/lib/product";
import StockStatus from "./StockStatus";
import { CloseIcon } from "./icons";

export default function QuickViewButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  function openModal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="absolute inset-x-3 bottom-3 rounded-md bg-ink/90 px-3 py-2 text-xs font-semibold text-cream opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        Quick View
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${product.name}`}
          // items-start + overflow-y-auto (rather than items-center on a
          // non-scrolling container) so that on a short viewport the modal
          // scrolls into view instead of being centered off both the top
          // and bottom simultaneously — confirmed via testing that the
          // close button and "View Full Details" link were both completely
          // unreachable at 320x480 with the previous centered/fixed layout.
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 py-8"
        >
          <button
            type="button"
            aria-label="Close quick view"
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close quick view"
              className="absolute right-4 top-4 rounded-full p-1 text-ink/50 hover:text-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-cream">
                <Image src={product.image.src} alt={product.image.alt} fill sizes="(min-width: 640px) 40vw, 90vw" className="object-contain p-5" />
              </div>
              <div>
                {product.category && (
                  <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
                    {product.category}
                  </span>
                )}
                <h2 className="mt-3 font-display text-2xl text-ink">{product.name}</h2>
                <p className="mt-2 font-semibold text-ink">{getCurrentPrice(product)}</p>
                <div className="mt-2">
                  <StockStatus status={product.stockStatus} />
                </div>
                <p className="mt-4 text-sm text-ink/70">{product.shortDescription}</p>
                <Link
                  href={`/products/${product.slug}`}
                  className="mt-6 inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
