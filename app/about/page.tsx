import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/lib/site-config";
import { galleryImages, trainingVideo } from "@/lib/media";
import SmartImage from "@/components/SmartImage";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${business.name}, a wholesale beauty supply and esthetic training center in Langley, BC.`,
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink pb-0 pt-20 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">About Us</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Our Story</h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/70">
            Built in Langley, British Columbia, to serve the makeup, spa, and medi-spa industry —
            one wholesale order and one certification at a time.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-6xl px-6 pb-16 sm:px-0">
          <SmartImage
            src="/images/nags-beauty-storefront.png"
            alt="Nag's Beauty Supplies and Training Centre storefront in Langley, BC"
            fit="contain"
            width={1851}
            height={849}
            bgClassName="bg-ink"
            sizes="(min-width: 1024px) 1152px, 100vw"
            preload
          />
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

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Our Founder</p>
            <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Meet Nagina Sharma</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm font-semibold uppercase tracking-wide text-gold-dark">
              Founder <span className="mx-2 text-ink/30">|</span> Beauty Professional{" "}
              <span className="mx-2 text-ink/30">|</span> Educator{" "}
              <span className="mx-2 text-ink/30">|</span> Entrepreneur{" "}
              <span className="mx-2 text-ink/30">|</span> Mentor
            </p>
            <div className="mx-auto mt-6 h-px w-16 bg-gold" />
          </div>
          <div className="mt-8 space-y-4 text-ink/70">
            <p>
              With more than 20 years of experience in the beauty industry and over 21 years of
              building her life and career in Canada, Nagina Sharma has dedicated her journey to
              beauty, education, entrepreneurship, and empowering others.
            </p>
            <p>
              Originally from India, Nagina brings together a strong academic background, advanced
              professional training, and decades of hands-on industry experience. Her commitment
              to continuous learning has shaped not only her own career, but also her passion for
              helping others develop their skills, confidence, and professional potential.
            </p>
            <p>
              As the founder of NAG Artistry Studio and NAG&rsquo;s Beauty Supplies and Training
              Center, Nagina has created more than beauty businesses. She has built spaces where
              clients feel valued, professionals can access quality products and education, and
              aspiring beauty professionals can gain practical knowledge to move forward in their
              careers.
            </p>
            <p>
              Known for her people-first approach, Nagina believes in listening, understanding
              individual needs, and providing genuine, practical guidance. Whether working with a
              client, student, professional, or aspiring entrepreneur, her goal is to help people
              feel supported and confident in their next step.
            </p>
            <p>
              Today, Nagina continues to grow her businesses with the same philosophy that has
              guided her throughout her career: keep learning, create opportunities, build
              meaningful relationships, and help others succeed.
            </p>
            <p className="border-l-2 border-gold py-1 pl-4 italic text-ink">
              Her mission is simple — to inspire confidence, create opportunity, and help others
              turn their potential into lasting success.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl text-ink">Inside Nag&rsquo;s</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/60">
            A closer look at the hands-on training that happens at our Langley center.
          </p>
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-ink/10 bg-ink">
              <video
                controls
                muted
                playsInline
                preload="metadata"
                className="w-full"
              >
                <source src={trainingVideo.src} type="video/mp4" />
              </video>
            </div>
            {galleryImages.map((img, i) => (
              <div
                key={img.src}
                className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-ink/10"
              >
                <SmartImage
                  src={img.src}
                  alt={img.alt}
                  fit="contain"
                  width={img.width}
                  height={img.height}
                  bgClassName={i % 2 === 0 ? "bg-cream" : "bg-ink"}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  containerClassName="w-full p-3"
                />
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
