import "server-only";
import { bridgeRequest, type BridgeResult } from "./bridge";
import { getCourseBySlug, type Course } from "@/lib/courses";
import { parseDollarsToCents } from "@/lib/checkout/validation";

// Course payments (full fee or deposit) as real WooCommerce orders, paid by
// e-Transfer. Prepared but OFF by default: COURSE_ONLINE_PAYMENTS_ENABLED
// must be "true", and the deposit amount is configured in WordPress
// (WooCommerce → Settings → Nag's Beauty), never hard-coded here. With no
// deposit configured, only full payment is offered.
//
// The course price comes from this app's own server-side course data
// (lib/courses.ts) — never from the browser.

export function coursePaymentsEnabled(): boolean {
  return process.env.COURSE_ONLINE_PAYMENTS_ENABLED === "true";
}

export interface PayableCourse {
  course: Course;
  priceCents: number;
}

export function getPayableCourse(slug: string): PayableCourse | null {
  const course = getCourseBySlug(slug);
  if (!course) return null;
  const priceCents = parseDollarsToCents(course.price);
  if (priceCents === null) return null;
  return { course, priceCents };
}

export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

export interface CoursePaymentOptions {
  depositAvailable: boolean;
  /** Decimal string, e.g. "250.00", when a deposit is configured. */
  depositAmount?: string;
}

export async function getCoursePaymentOptions(priceCents: number): Promise<BridgeResult<CoursePaymentOptions>> {
  return bridgeRequest<CoursePaymentOptions>("/courses/options", { coursePrice: centsToDecimal(priceCents) });
}

export interface CourseOrderInput {
  userId: string | null;
  course: PayableCourse;
  paymentType: "full" | "deposit";
  student: { firstName: string; lastName: string; email: string; phone: string };
  idempotencyKey: string;
  policyAcceptedAt: string;
  clientIp: string;
}

export interface CourseOrderResult {
  orderId: number;
  orderNumber: string;
  amountDue: string;
  remainingBalance: string;
  duplicate: boolean;
}

export async function createCourseOrder(input: CourseOrderInput): Promise<BridgeResult<CourseOrderResult>> {
  return bridgeRequest<CourseOrderResult>(
    "/courses/order",
    {
      userId: input.userId ?? 0,
      courseSlug: input.course.course.slug,
      courseTitle: input.course.course.title,
      coursePrice: centsToDecimal(input.course.priceCents),
      paymentType: input.paymentType,
      student: input.student,
      idempotencyKey: input.idempotencyKey,
      policyAcceptedAt: input.policyAcceptedAt,
      ip: input.clientIp,
    },
    { timeoutMs: 45_000 }
  );
}
