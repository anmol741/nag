import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${business.name}, a wholesale beauty supply and esthetic training center in Langley, BC.`,
};

const galleryCaptions = [
  "Storefront entrance",
  "Wholesale supply floor",
  "Esthetics training room",
  "Treatment demonstration area",
  "Product display shelving",
  "Hands-on training session",
  "Retail checkout counter",
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink py-20 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">About Us</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Our Story</h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/70">
            Built in Langley, British Columbia, to serve the makeup, spa, and medi-spa industry —
            one wholesale order and one certification at a time.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-ink">Wholesale Beauty Supplies</h2>
              <p className="mt-3 text-ink/70">
                Nag&rsquo;s Beauty Supplies &amp; Training Centre Ltd is a wholesale supplier and
                professional training center for the makeup, spa, and medi-spa industry. We stock
                supplies for professional treatments including facials, makeup application,
                eyelash extensions, eyelash tinting, manicure and pedicure, waxing, body
                treatments, aromatherapy, laser, and medical esthetics.
              </p>
              <p className="mt-3 text-ink/70">
                Our Langley, BC storefront is open five days a week for in-person browsing, and
                the online shop is available around the clock.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">Advanced Education Centre</h2>
              <p className="mt-3 text-ink/70">
                We&rsquo;re home to Langley&rsquo;s most in-depth Advanced Education Centre —
                bringing next-level education from industry experts to help estheticians expand
                their knowledge, expertise, and professional edge.
              </p>
              <p className="mt-3 text-ink/70">
                From skin and facial treatments to PMU, waxing, brows and lashes, makeup and hair,
                and beauty business management, our in-person courses are built for hands-on,
                practical learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl text-ink">Inside Nag&rsquo;s</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/60">
            Gallery photography from our Langley storefront and training center is coming soon.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {galleryCaptions.map((caption, i) => (
              <div
                key={caption}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-ink/10 bg-gradient-to-br from-ink-soft to-ink p-4 text-center"
                style={{ opacity: 1 - i * 0.03 }}
              >
                <span className="font-display text-xl text-gold-light/70">N</span>
                <span className="text-xs text-white/50">{caption}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl text-ink">Visit Us in Langley</h2>
          <p className="mt-3 text-ink/70">{business.address.full}</p>
          <p className="text-ink/70">{business.phone}</p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            Get Directions &amp; Contact Info
          </Link>
        </div>
      </section>
    </>
  );
}
