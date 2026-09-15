import type { Metadata } from "next";
import { business } from "@/lib/site-config";
import { MapPinIcon, PhoneIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import SocialLinks from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${business.name} in Langley, BC — ${business.phone}.`,
};

export default function ContactPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    business.address.full
  )}`;

  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">Get In Touch</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Questions about wholesale ordering, course enrollment, or anything else? We&rsquo;d
            love to hear from you.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl text-ink">Visit or Reach Out</h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="font-medium text-ink">{business.address.full}</p>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-dark hover:underline">
                    Get Directions →
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <a href={business.phoneHref} className="font-medium text-ink hover:text-gold-dark">
                  {business.phone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <SocialLinks className="font-medium text-ink" iconClassName="h-5 w-5 text-gold-dark" />
              </div>
              <p className="text-sm text-ink/60">{business.hours}</p>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex aspect-video items-center justify-center rounded-xl border border-ink/10 bg-cream text-sm text-ink/50 transition-colors hover:border-gold"
            >
              View map to {business.address.city}, {business.address.region} →
            </a>
          </div>

          <div className="md:col-span-3">
            <h2 className="font-display text-2xl text-ink">Send a Message</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
