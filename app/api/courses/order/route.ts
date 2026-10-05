import { NextResponse } from "next/server";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { getSession } from "@/lib/server/session";
import { coursePaymentsEnabled, createCourseOrder, getPayableCourse } from "@/lib/server/course-payments";
import { parseIdempotencyKey } from "@/lib/checkout/validation";
import { isValidCanadianPhone, isValidEmail, normalizeEmail, normalizePhone } from "@/lib/validation";

function str(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!coursePaymentsEnabled()) {
    return NextResponse.json({ error: "Online course payments aren't available yet. Please submit an enrollment request instead." }, { status: 404 });
  }
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const limit = checkRateLimit(`course-order:${ip}`, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const idempotencyKey = parseIdempotencyKey(body.idempotencyKey);
  const course = getPayableCourse(str(body.courseSlug, 100));
  const paymentType = body.paymentType === "deposit" ? "deposit" : body.paymentType === "full" ? "full" : null;
  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const email = str(body.email, 254);
  const phone = str(body.phone, 30);

  const fieldErrors: Record<string, string> = {};
  if (!course) fieldErrors.courseSlug = "Please select a course.";
  if (!paymentType) fieldErrors.paymentType = "Choose full payment or deposit.";
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!isValidEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!isValidCanadianPhone(phone)) fieldErrors.phone = "Enter a valid Canadian phone number.";
  if (body.acceptedPolicy !== true) fieldErrors.acceptedPolicy = "Please accept the Training Course Policy.";
  if (!idempotencyKey) return NextResponse.json({ error: "Invalid request. Please refresh the page and try again." }, { status: 400 });
  if (Object.keys(fieldErrors).length > 0 || !course || !paymentType) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const session = await getSession();
  const result = await createCourseOrder({
    userId: session?.sub ?? null,
    course,
    paymentType,
    student: { firstName, lastName, email: normalizeEmail(email), phone: normalizePhone(phone) },
    idempotencyKey,
    policyAcceptedAt: new Date().toISOString(),
    clientIp: ip,
  });

  if (result.ok) return NextResponse.json({ ok: true, order: result.data }, { headers: { "Cache-Control": "private, no-store" } });
  if (result.reason === "rejected") return NextResponse.json({ error: result.message, code: result.code }, { status: 409 });
  return NextResponse.json({ error: "We couldn't confirm your course payment request. Please try again — retrying won't create a duplicate.", retryable: true }, { status: 503 });
}
