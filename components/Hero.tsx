import Image from "next/image";
import Link from "next/link";
import { DiamondIcon, GraduationCapIcon, HeartIcon, MapPinIcon, TruckIcon, UsersIcon } from "./icons";

/**
 * Hero-only cutout of the brand logo (public/file_00000000c67081fdbe499ba3c908816c.png
 * is untouched, and so is the cropped-but-opaque
 * public/images/nags-logo-hero-cropped.png it was derived from).
 * nags-logo-transparent.png replaces that flat charcoal background with
 * real alpha transparency — computed via flood fill from the image
 * border through background-similar pixels only (never jumping into
 * enclosed shapes), so the black cosmetic bottles, the black tonal bands
 * in the hair, and the black letter shading all stay intact and opaque.
 * A ~150px connected-component cleanup removes leftover background grain
 * specks (every real design element, even a single subtitle letter, is
 * 300px+, so nothing legible was at risk), and the resulting hard alpha
 * edge is feathered ~1px so it scales smoothly. No mix-blend-mode is
 * used — this is genuine per-pixel transparency.
 */
const heroLogo = {
  src: "/images/nags-logo-transparent.png",
  alt: "Nag's Beauty Supplies & Training Center logo",
  width: 1448,
  height: 739,
};

const features = [
  { icon: DiamondIcon, label: "Premium Beauty Supplies" },
  { icon: GraduationCapIcon, label: "Professional Training Courses" },
  { icon: UsersIcon, label: "Supporting Beauty Professionals" },
  { icon: HeartIcon, label: "Beauty Changes Lives" },
] as const;

const infoStrip = [
  { icon: MapPinIcon, label: "Langley, British Columbia", sublabel: "Visit Our Store" },
  { icon: TruckIcon, label: "Fast & Reliable Shipping", sublabel: "Across Canada" },
  { icon: UsersIcon, label: "Trusted by Beauty Professionals", sublabel: "Students, Salons & Spas" },
  { icon: HeartIcon, label: "Expert Support", sublabel: "We're Here to Help" },
] as const;

/**
 * Homepage hero, redesigned from the client's supplied reference mockup
 * ("website front page 1.png"). Every word here is a live text node and
 * every CTA a working <Link> — none of it is baked into the background
 * photo (public/nags-hero-clean.png, client-confirmed as an asset made
 * for this project). The photo sits behind the left-aligned text column
 * as a `fill` background with a dark overlay for contrast; the model
 * stays visible on the right on large screens, and gets a much stronger,
 * near-opaque overlay on narrow screens where the text column and the
 * photo occupy the same visual space (see the two overlay divs below).
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      <div className="relative">
        <div className="absolute inset-0">
          <Image
            src="/nags-hero-clean.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover object-[60%_22%] sm:object-[66%_24%] lg:object-[74%_center]"
          />
          {/* Mobile/tablet: the text column sits centered over the whole
              photo, so it needs a strong, uniform dark wash to stay
              readable — the model becomes a subtle textured backdrop
              rather than competing with the text. Kept strong all the way
              up to `lg` (not just under `sm`) — at 640–1023px the column
              is still centered over her face, so lightening the overlay
              there let it show through too clearly behind the text. */}
          <div className="absolute inset-0 bg-ink/85 lg:hidden" />
          {/* Large screens: text moves to a left-aligned column, so the
              overlay is a left-to-right gradient instead — opaque behind
              the text, fading away so the model stays clearly visible on
              the right. Lighter than before (via-ink/78 vs the old /90,
              fading fully to transparent instead of stopping at /20) so
              more of her face reads through while the text column itself
              still sits on solid, high-contrast ink. */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-ink from-5% via-ink/78 via-40% to-transparent to-75% lg:block" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,_rgba(184,150,79,0.18),_transparent_55%)]" />
          {/* Brightens the gold wave graphic baked into the bottom-left
              of the photo — screen blending only lifts the already-gold
              pixels, it can't add a wave that isn't there. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-gold/35 via-gold/10 to-transparent mix-blend-screen" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 py-14 sm:py-20 lg:px-12 lg:py-24">
          <div className="lg:grid lg:grid-cols-[56%_44%] lg:items-center lg:gap-8">
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              {/* The logo image below shows the "Nag's Beauty" wordmark
                  visually, but a real, selectable <h1> still carries the
                  page's primary heading — the business name is never *only*
                  pixels in an image. */}
              <h1 className="sr-only">Nag&rsquo;s Beauty Supplies &amp; Training Center</h1>
              <div className="relative mx-auto w-full max-w-[340px] md:max-w-[460px] lg:mx-0 lg:max-w-[650px]">
                <Image
                  src={heroLogo.src}
                  alt={heroLogo.alt}
                  width={heroLogo.width}
                  height={heroLogo.height}
                  preload
                  sizes="(min-width: 1024px) 650px, (min-width: 768px) 460px, 340px"
                  className="h-auto w-full"
                />
              </div>

              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.35em] text-gold-light sm:text-base lg:text-lg">
                Beauty &middot; Education &middot; Empowerment
              </p>
              <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-white/85 sm:text-xl lg:mx-0 lg:text-2xl">
                Your trusted source for professional beauty supplies, esthetics training, and
                ongoing support.
              </p>

              <div className="mx-auto mt-10 grid max-w-sm grid-cols-2 gap-x-4 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-6">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-3 px-1 lg:items-start">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold/10">
                      <Icon className="h-8 w-8 text-gold-light" />
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
                <Link
                  href="/shop"
                  className="rounded-md bg-gold px-8 py-4 text-base font-semibold text-ink transition-colors hover:bg-gold-light lg:text-lg"
                >
                  Shop Online →
                </Link>
                <Link
                  href="/courses"
                  className="rounded-md border-2 border-white/25 px-8 py-4 text-base font-semibold text-cream transition-colors hover:border-gold hover:text-gold-light lg:text-lg"
                >
                  View Training Courses
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 text-base font-semibold text-white/70 transition-colors hover:text-gold-light lg:text-lg"
                >
                  Contact Us →
                </Link>
              </div>
            </div>

            {/* Decorative slogan for the model's side on large screens only.
                Low-opacity and set well clear of the text column so it
                reads as ambient set-dressing, never competing with — or
                sitting on top of — her face. */}
            <div
              aria-hidden="true"
              className="pointer-events-none relative hidden h-full items-center justify-end lg:flex"
            >
              <p className="max-w-[4rem] text-right text-2xl font-semibold uppercase leading-tight tracking-[0.2em] text-gold-light/25 [writing-mode:vertical-rl]">
                Invest in Your Beauty Future
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative border-t border-white/10 bg-black/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-6 py-10 sm:grid-cols-4 sm:px-6 lg:py-12">
          {infoStrip.map(({ icon: Icon, label, sublabel }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-7 w-7 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{label}</p>
                <p className="text-sm text-white/60">{sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
