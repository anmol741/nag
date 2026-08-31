"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Course } from "@/lib/courses";
import { courseCategories, type CourseCategorySlug } from "@/lib/site-config";
import CourseCard from "./CourseCard";

export default function CourseFilterGrid({ courses }: { courses: Course[] }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as CourseCategorySlug | null;
  const [active, setActive] = useState<CourseCategorySlug | "all">(
    initialCategory && courseCategories.some((c) => c.slug === initialCategory) ? initialCategory : "all"
  );

  const filtered = useMemo(
    () => (active === "all" ? courses : courses.filter((c) => c.category === active)),
    [active, courses]
  );

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActive("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === "all" ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
          }`}
        >
          All Courses
        </button>
        {courseCategories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === cat.slug ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink/50">
        Showing {filtered.length} of {courses.length} courses
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </div>
  );
}
