import type { ReactNode } from "react";
import Link from "next/link";
import { business } from "@/lib/site-config";

export type PolicySection = {
  heading: string;
  body: ReactNode;
};

/**
 * Shared layout for the four policy pages. Renders the draft-review notice
 * and "last updated" line above the content, and a contact block below it,
 * so every policy page stays visually and structurally consistent.
 */
export default function PolicyLayout({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-white/60">{lastUpdated}</p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-xl border border-dashed border-gold-dark/40 bg-cream p-5">
            <p className="text-sm font-semibold text-ink">Draft for client review</p>
            <p className="mt-1 text-sm text-ink/70">
              This sample policy has not yet received final legal or client approval and may
              change before the website launches.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="mx-auto max-w-3xl px-6">
          {sections.map((section) => (
            <div key={section.heading} className="mt-10 first:mt-0">
              <h2 className="font-display text-2xl text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-ink/70">{section.body}</div>
            </div>
          ))}

          <div className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="font-display text-2xl text-ink">Contact Information</h2>
            <div className="mt-3 space-y-1 text-ink/70">
              <p>{business.name}</p>
              <p>{business.address.full}</p>
              <p>{business.phone}</p>
              <p>Email: [CLIENT TO CONFIRM]</p>
            </div>
            <p className="mt-6 text-sm text-ink/60">
              Questions in the meantime?{" "}
              <Link href="/contact" className="text-gold-dark hover:underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
