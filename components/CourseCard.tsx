import Link from "next/link";
import type { Course } from "@/lib/courses";
import { categoryLabel } from "@/lib/site-config";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-ink via-ink-soft to-black">
        <span className="font-display text-3xl text-gold-light/80">N</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
          {categoryLabel(course.category)}
        </span>
        <h3 className="mt-3 font-display text-lg leading-snug text-ink group-hover:text-gold-dark">
          {course.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-sm text-ink/60">
          <span className="font-semibold text-ink">
            {course.price}
            {course.priceNote && <span className="ml-1 text-xs font-normal text-ink/50">({course.priceNote})</span>}
          </span>
          <span>&middot;</span>
          <span>{course.duration}</span>
        </div>
        <span className="mt-4 inline-flex items-center text-sm font-medium text-gold-dark">
          View Course Details →
        </span>
      </div>
    </Link>
  );
}
