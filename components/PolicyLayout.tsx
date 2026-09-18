import type { ReactNode } from "react";
import Link from "next/link";
import { policyContact } from "@/lib/site-config";

export type PolicySection = {
  heading: ReactNode;
  body: ReactNode;
};

/**
 * Shared layout for the five policy pages. Content on each page comes
 * verbatim from the client's signed policy PDF
 * (docs/Nags-Beauty-Website-Policies.pdf) — this component only supplies
 * the shared chrome (heading, effective date, contact block) around it.
 */
export default function PolicyLayout({
  title,
  effectiveDate,
  sections,
}: {
  title: string;
  effectiveDate: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-white/60">Effective Date: {effectiveDate}</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          {sections.map((section, index) => (
            <div key={index} className="mt-10 first:mt-0">
              <h2 className="font-display text-2xl text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-ink/70">{section.body}</div>
            </div>
          ))}

          <div className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="font-display text-2xl text-ink">Contact</h2>
            <div className="mt-3 space-y-1 text-ink/70">
              <p>{policyContact.businessName}</p>
              <p>{policyContact.address}</p>
              <p>
                Email:{" "}
                <a href={policyContact.emailHref} className="text-gold-dark hover:underline">
                  {policyContact.email}
                </a>
              </p>
              <p>
                Phone:{" "}
                <a href={policyContact.phoneHref} className="text-gold-dark hover:underline">
                  {policyContact.phone}
                </a>
              </p>
              <p>{policyContact.website}</p>
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
