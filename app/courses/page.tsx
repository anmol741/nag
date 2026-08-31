import type { Metadata } from "next";
import { Suspense } from "react";
import { courses } from "@/lib/courses";
import CourseFilterGrid from "@/components/CourseFilterGrid";

export const metadata: Metadata = {
  title: "Training Courses",
  description:
    "Browse all esthetic certification courses at Nag's Beauty Supplies & Training Center in Langley, BC — skin & facial, waxing, brows & lashes, PMU, makeup & hair, and business.",
};

export default function CoursesPage() {
  return (
    <>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-light">
            Advanced Education Centre
          </p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Training Courses</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            {courses.length} in-person certification courses across six specialties, taught at our
            Langley storefront and training center.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Suspense fallback={null}>
            <CourseFilterGrid courses={courses} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
