import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coursePaymentsEnabled, getCoursePaymentOptions, getPayableCourse, centsToDecimal } from "@/lib/server/course-payments";
import CoursePaymentForm from "@/components/CoursePaymentForm";

export const metadata: Metadata = { title: "Course Payment", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Course payment by e-Transfer (full fee or configured deposit). Hidden (404) unless COURSE_ONLINE_PAYMENTS_ENABLED=true. */
export default async function CoursePaymentPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  if (!coursePaymentsEnabled()) notFound();

  const { course: slug } = await searchParams;
  const payable = slug ? getPayableCourse(slug) : null;

  if (!payable) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h1 className="font-display text-3xl text-ink">Course Payment</h1>
          <p className="mt-4 text-ink/60">
            Please choose a course first. <Link href="/courses" className="text-gold-dark hover:underline">Browse courses</Link>.
          </p>
        </div>
      </section>
    );
  }

  const options = await getCoursePaymentOptions(payable.priceCents);
  const depositAmount = options.ok && options.data.depositAvailable ? options.data.depositAmount : undefined;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">Reserve Your Seat</p>
          <h1 className="mt-4 font-display text-3xl text-ink">{payable.course.title}</h1>
          <p className="mt-2 text-ink/60">
            {payable.course.price}
            {payable.course.priceNote ? ` (${payable.course.priceNote})` : ""} · {payable.course.duration}
          </p>
        </div>
        <div className="mt-10">
          {options.ok ? (
            <CoursePaymentForm
              courseSlug={payable.course.slug}
              courseTitle={payable.course.title}
              coursePrice={centsToDecimal(payable.priceCents)}
              depositAmount={depositAmount}
            />
          ) : (
            <p className="text-center text-ink/60">Online course payment is temporarily unavailable. Please try again shortly.</p>
          )}
        </div>
      </div>
    </section>
  );
}
