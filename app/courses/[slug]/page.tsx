import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourseBySlug, getCoursesByCategory } from "@/lib/courses";
import { categoryLabel } from "@/lib/site-config";
import CourseCard from "@/components/CourseCard";
import SmartImage from "@/components/SmartImage";
import { CheckIcon } from "@/components/icons";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return {};

  const title = course.title;
  const description = course.overview[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: course.image, alt: course.imageAlt }],
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const related = getCoursesByCategory(course.category).filter((c) => c.slug !== course.slug).slice(0, 3);

  const facts = [
    { label: "Price", value: course.priceNote ? `${course.price} (${course.priceNote})` : course.price },
    { label: "Duration", value: course.duration },
    { label: "Level", value: course.level },
    { label: "Language", value: course.language },
    ...(course.exam ? [{ label: "Exam", value: course.exam }] : []),
    ...(course.includes ? [{ label: "Includes", value: course.includes }] : []),
  ];

  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-5 md:items-center">
          <div className="md:col-span-3">
            <Link href="/courses" className="text-sm text-gold-light hover:underline">
              ← All Training Courses
            </Link>
            <span className="mt-4 block w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-light">
              {categoryLabel(course.category)}
            </span>
            <h1 className="mt-4 font-display text-3xl sm:text-4xl">{course.title}</h1>

            {(course.prerequisite || course.notForBeginners) && (
              <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-light">
                {course.prerequisite ?? course.notForBeginners}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <p className="text-xs uppercase tracking-wider text-white/50">{f.label}</p>
                  <p className="font-medium text-cream">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/enroll?course=${course.slug}`}
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Enroll Now
              </Link>
              <Link
                href="/contact"
                className="rounded-md border border-white/25 px-6 py-3 text-sm font-semibold hover:border-gold hover:text-gold-light"
              >
                Ask a Question
              </Link>
            </div>
          </div>

          <SmartImage
            src={course.image}
            alt={course.imageAlt}
            fit={course.imageFit}
            position={course.imagePosition}
            width={course.imageWidth}
            height={course.imageHeight}
            sizes="(min-width: 768px) 40vw, 100vw"
            preload
            bgClassName="bg-cream"
            containerClassName="w-full rounded-xl border border-gold/20 p-4 shadow-md md:col-span-2"
          />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-4xl gap-10 px-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl text-ink">Course Overview</h2>
            <div className="mt-4 space-y-4 text-ink/70">
              {course.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {course.instructor && (
              <p className="mt-4 text-sm text-ink/60">
                <span className="font-semibold text-ink">Instructor:</span> {course.instructor}
              </p>
            )}

            {course.whoShouldEnroll && (
              <div className="mt-8">
                <h3 className="font-display text-xl text-ink">Who Should Enroll?</h3>
                <ul className="mt-3 space-y-2">
                  {course.whoShouldEnroll.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-ink/70">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.whatYoullLearn && (
              <div className="mt-8">
                <h3 className="font-display text-xl text-ink">What You&rsquo;ll Learn</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {course.whatYoullLearn.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink/70">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.certificateNote && (
              <p className="mt-8 rounded-md bg-cream px-4 py-3 text-sm text-ink/70">
                🎓 {course.certificateNote}
              </p>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-ink/10 bg-cream p-6">
            <p className="text-xs uppercase tracking-wider text-ink/50">Investment</p>
            <p className="mt-1 font-display text-3xl text-ink">{course.price}</p>
            {course.priceNote && <p className="text-sm text-ink/60">{course.priceNote}</p>}
            <div className="mt-4 space-y-2 text-sm text-ink/70">
              <p>
                <span className="font-semibold text-ink">Duration:</span> {course.duration}
              </p>
              <p>
                <span className="font-semibold text-ink">Level:</span> {course.level}
              </p>
              <p>
                <span className="font-semibold text-ink">Language:</span> {course.language}
              </p>
              <p>
                <span className="font-semibold text-ink">Delivery:</span> In-person, Langley, BC
              </p>
            </div>
            <Link
              href={`/enroll?course=${course.slug}`}
              className="mt-6 block rounded-md bg-gold px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-gold-light"
            >
              Enroll Now
            </Link>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-cream py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl text-ink">More in {categoryLabel(course.category)}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
