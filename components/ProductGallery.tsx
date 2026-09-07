"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/product";

export default function ProductGallery({ main, gallery = [] }: { main: ProductImage; gallery?: ProductImage[] }) {
  const images = [main, ...gallery];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? main;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-ink/10 bg-cream">
        <Image src={active.src} alt={active.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-md border bg-cream ${
                i === activeIndex ? "border-gold" : "border-ink/10"
              }`}
            >
              <Image src={img.src} alt="" fill sizes="10vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
