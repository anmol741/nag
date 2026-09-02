import Link from "next/link";
import type { Course } from "@/lib/courses";
import { categoryLabel } from "@/lib/site-config";
import SmartImage from "./SmartImage";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <SmartImage
        src={course.image}
        alt={course.imageAlt}
        fit={course.imageFit}
        position={course.imagePosition}
        width={course.imageWidth}
        height={course.imageHeight}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        containerClassName="w-full shrink-0 border-b border-ink/10 p-3"
        bgClassName="bg-cream"
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full bg-gold/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-dark">
          {categoryLabel(course.category)}
        </span>
        <h3 className="mt-3 font-display text-lg leading-snug text-ink group-hover:text-gold-dark">
          {course.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
          <span className="font-semibold text-ink">
            {course.price}
            {course.priceNote && <span className="ml-1 text-xs font-normal text-ink/50">({course.priceNote})</span>}
          </span>
          <span>&middot;</span>
          <span>{course.duration}</span>
          <span>&middot;</span>
          <span>{course.level}</span>
        </div>
        <span className="mt-4 inline-flex w-fit items-center rounded-md bg-ink px-4 py-2 text-xs font-semibold text-cream transition-colors group-hover:bg-gold group-hover:text-ink">
          View Course Details →
        </span>
      </div>
    </Link>
  );
}
