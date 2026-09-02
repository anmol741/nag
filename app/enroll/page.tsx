import type { Metadata } from "next";
import { courses, getCourseBySlug } from "@/lib/courses";
import EnrollForm from "@/components/EnrollForm";

export const metadata: Metadata = {
  title: "Enroll Now",
  description: "Request enrollment in a certification course at Nag's Beauty Supplies & Training Center in Langley, BC.",
};

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseParam } = await searchParams;
  const preselected = courseParam ? getCourseBySlug(courseParam) : undefined;
  const initialCourseSlug = preselected?.slug ?? courses[0].slug;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Get Started</p>
          <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Enroll Now</h1>
          <p className="mt-3 text-ink/60">
            Tell us a bit about yourself and confirm your course selection — our team will follow up
            to finalize your enrollment.
          </p>
        </div>
        <div className="mt-10">
          <EnrollForm courses={courses} initialCourseSlug={initialCourseSlug} />
        </div>
      </div>
    </section>
  );
}
