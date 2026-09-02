"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Course } from "@/lib/courses";
import { courseCategories, type CourseCategorySlug } from "@/lib/site-config";
import CourseCard from "./CourseCard";

function isCourseCategorySlug(value: string | null): value is CourseCategorySlug {
  return value !== null && courseCategories.some((c) => c.slug === value);
}

export default function CourseFilterGrid({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Derive the active filter straight from the URL on every render, instead
  // of copying it into local state once — that copy went stale whenever the
  // query string changed without remounting this component (e.g. clicking a
  // header dropdown category while already on /courses).
  const categoryParam = searchParams.get("category");
  const active: CourseCategorySlug | "all" = isCourseCategorySlug(categoryParam) ? categoryParam : "all";

  const filtered = useMemo(
    () => (active === "all" ? courses : courses.filter((c) => c.category === active)),
    [active, courses]
  );

  // Bring the filter/catalogue section into view when arriving with a
  // category already selected (e.g. from the header dropdown).
  useEffect(() => {
    if (categoryParam) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [categoryParam]);

  function selectCategory(next: CourseCategorySlug | "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("category");
    } else {
      params.set("category", next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div ref={sectionRef}>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => selectCategory("all")}
          aria-pressed={active === "all"}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === "all" ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
          }`}
        >
          All Courses
        </button>
        {courseCategories.map((cat) => (
          <button
            type="button"
            key={cat.slug}
            onClick={() => selectCategory(cat.slug)}
            aria-pressed={active === cat.slug}
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
