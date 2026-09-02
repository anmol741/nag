import Link from "next/link";
import { business } from "@/lib/site-config";
import { courses, getCourseBySlug } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";
import SmartImage from "@/components/SmartImage";
import StatsBar from "@/components/StatsBar";
import Testimonials from "@/components/Testimonials";
import InstructorSection from "@/components/InstructorCard";
import { CheckIcon } from "@/components/icons";

const heroCourse = getCourseBySlug("bb-glow-certification");
const wholesaleCourse = getCourseBySlug("beauty-business-management-course");
const educationCourse = getCourseBySlug("brow-lamination-shaping-mapping-certification");

const popularSlugs = [
  "bb-glow-certification",
  "full-body-waxing-certification",
  "brow-lamination-shaping-mapping-certification",
  "microblading-certification",
  "lash-lift-tint-certification",
  "sugaring-certification-course",
];

export default function Home() {
  const popularCourses = popularSlugs
    .map((slug) => getCourseBySlug(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(184,150,79,0.18),_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 md:grid-cols-[56%_44%] md:items-center">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-light">
              Langley, British Columbia
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight text-cream sm:text-5xl">
              Welcome to Nag&rsquo;s Beauty Supplies &amp; Training Center
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-white/70 sm:text-lg md:mx-0">
              {business.tagline}. A wholesale supplier and professional training center for the
              makeup, spa, and medi-spa industry.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Link
                href="/shop"
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
              >
                Shop Online
              </Link>
              <Link
                href="/courses"
                className="rounded-md border border-white/25 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-gold hover:text-gold-light"
              >
                View Training Courses
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-gold-light"
              >
                Contact Us →
              </Link>
            </div>
          </div>
          {heroCourse && (
            <SmartImage
              src={heroCourse.image}
              alt={heroCourse.imageAlt}
              fit="contain"
              width={heroCourse.imageWidth}
              height={heroCourse.imageHeight}
              preload
              sizes="(min-width: 768px) 44vw, 100vw"
              bgClassName="bg-cream"
              containerClassName="w-full rounded-2xl border-2 border-gold/40 p-4 shadow-xl"
            />
          )}
        </div>
      </section>

      {/* Two-column intro */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
          <div>
            {wholesaleCourse && (
              <SmartImage
                src={wholesaleCourse.image}
                alt="Desk with a business-planning notebook checklist, reference books, and a phone"
                fit="contain"
                width={wholesaleCourse.imageWidth}
                height={wholesaleCourse.imageHeight}
                sizes="(min-width: 768px) 45vw, 90vw"
                bgClassName="bg-cream"
                containerClassName="mb-6 w-full rounded-xl border border-gold/20 p-4 shadow-md"
              />
            )}
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
              Wholesale Beauty Supplies
            </span>
            <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
              Everything Your Practice Needs, In One Storefront
            </h2>
            <p className="mt-4 text-ink/70">
              Nag&rsquo;s Beauty Supplies &amp; Training Centre Ltd is a wholesale supplier and
              professional training center for the makeup, spa, and medi-spa industry. Supplies
              for professional treatments including facials, makeup application, eyelash
              extensions, eyelash tinting, manicure and pedicure, waxing, body treatments,
              aromatherapy, laser, and medical esthetics.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink/70">
              {[
                "Langley, BC storefront open 5 days a week",
                "Shop online 24/7",
                "Professional-grade product lines for estheticians",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-gold-dark hover:underline">
              Shop Online →
            </Link>
          </div>
          <div>
            {educationCourse && (
              <SmartImage
                src={educationCourse.image}
                alt="Close-up of brow lamination and shaping training on a client's eyebrow"
                fit="contain"
                width={educationCourse.imageWidth}
                height={educationCourse.imageHeight}
                sizes="(min-width: 768px) 45vw, 90vw"
                bgClassName="bg-cream"
                containerClassName="mb-6 w-full rounded-xl border border-gold/20 p-4 shadow-md"
              />
            )}
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
              Education Courses
            </span>
            <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
              Langley&rsquo;s Most In-Depth Advanced Education Centre
            </h2>
            <p className="mt-4 text-ink/70">
              Home to Langley&rsquo;s most in-depth Advanced Education Centre — bringing
              next-level education from industry experts to help estheticians expand their
              knowledge, expertise, and professional edge.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink/70">
              {[
                `${courses.length} in-person certification courses`,
                "Skin, waxing, brows & lashes, PMU, makeup & hair, and business tracks",
                "Hands-on training with certificates upon completion",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/courses" className="mt-6 inline-block text-sm font-semibold text-gold-dark hover:underline">
              View Training Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Popular courses */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark">
              Advanced Education Centre
            </span>
            <h2 className="mt-3 font-display text-3xl text-ink">Popular Courses</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/courses"
              className="inline-block rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-gold hover:text-gold-dark"
            >
              View All {courses.length} Courses
            </Link>
          </div>
        </div>
      </section>

      <StatsBar />
      <Testimonials />
      <InstructorSection />

      {/* CTA */}
      <section className="bg-gradient-to-br from-ink via-ink-soft to-black py-20 text-cream">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">Ready to Grow Your Skillset or Your Shelf?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Visit our Langley storefront, browse the online shop, or enroll in a certification
            course led by industry professionals.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/courses"
              className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
            >
              Enroll in a Course
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white/25 px-6 py-3 text-sm font-semibold hover:border-gold hover:text-gold-light"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
