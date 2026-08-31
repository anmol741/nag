import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Shop Online",
  description:
    "Wholesale beauty supplies from Nag's Beauty Supplies & Training Center — facial, waxing, lash & brow, makeup, and medical esthetics products.",
};

const supplyCategories = [
  "Facials & Skin Care",
  "Makeup Application",
  "Eyelash Extensions & Tinting",
  "Manicure & Pedicure",
  "Waxing & Body Treatments",
  "Aromatherapy",
  "Laser & Medical Esthetics",
  "PMU & Microblading Tools",
];

export default function ShopPage() {
  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
            Wholesale Beauty Supplies
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Shop Online</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Professional-grade supplies for the makeup, spa, and medi-spa industry. Our full
            catalog is being brought online — in the meantime, browse by category below or reach
            out for wholesale ordering.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {supplyCategories.map((cat) => (
              <div
                key={cat}
                className="flex flex-col items-start gap-3 rounded-xl border border-ink/10 p-6 transition-shadow hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-display text-gold-dark">
                  N
                </span>
                <h3 className="font-display text-base text-ink">{cat}</h3>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
            <h2 className="font-display text-xl text-ink">Full Catalog Coming Online Soon</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink/60">
              Our complete wholesale product catalog is in the process of moving online. For
              immediate ordering, visit our Langley storefront or get in touch with our team
              directly.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href={business.phoneHref}
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Call {business.phone}
              </a>
              <Link
                href="/contact"
                className="rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-gold hover:text-gold-dark"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
