"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/courses";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseSlug: string;
  message: string;
  consent: boolean;
  /** Honeypot field — real visitors never see or fill this in. */
  website: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;
type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function EnrollForm({
  courses,
  initialCourseSlug,
}: {
  courses: Course[];
  initialCourseSlug: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    courseSlug: initialCourseSlug,
    message: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const submitted = status === "success";

  const selectedCourse = useMemo(
    () => courses.find((c) => c.slug === values.courseSlug),
    [courses, values.courseSlug]
  );

  function updateCourse(slug: string) {
    setValues((v) => ({ ...v, courseSlug: slug }));
    router.replace(`/enroll?course=${slug}`, { scroll: false });
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!values.firstName.trim()) next.firstName = "First name is required.";
    if (!values.lastName.trim()) next.lastName = "Last name is required.";
    if (!values.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!values.phone.trim()) next.phone = "Phone number is required.";
    if (!values.courseSlug) next.courseSlug = "Please select a course.";
    if (!values.consent) next.consent = "Please confirm you agree to be contacted about this enrollment.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot: bots tend to fill every field, including ones hidden from
    // real users via CSS. A silent success avoids tipping them off.
    if (values.website) {
      setStatus("success");
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");
    try {
      // Demo-only submission — no backend is connected yet.
      // Integration point: replace this with a POST to a real enrollment
      // API (e.g. `await fetch("/api/enroll", { method: "POST", body: ... })`)
      // once a form backend is available. The try/catch below is already
      // structured to show the error state if that request fails.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "error") {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-ink">
        <p className="font-display text-2xl">Something went wrong</p>
        <p className="mt-2 text-ink/70">
          We couldn&rsquo;t submit your enrollment request. Please try again, or reach us directly
          at{" "}
          <a href="tel:+17782787727" className="font-semibold text-gold-dark hover:underline">
            (778) 278-7727
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-8 text-center text-ink">
        <p className="font-display text-2xl">You&rsquo;re on the list!</p>
        <p className="mt-2 text-ink/70">
          Thanks, {values.firstName}. We&rsquo;ve noted your interest in{" "}
          <span className="font-semibold">{selectedCourse?.title}</span> and will follow up at{" "}
          {values.email} or {values.phone} to confirm enrollment details.
        </p>
        <p className="mt-4 text-xs uppercase tracking-wider text-ink/40">
          Demo submission — not yet connected to a live backend.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot: hidden from sighted and screen-reader users, but visible to most bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-ink">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {errors.firstName && (
            <p id="firstName-error" className="mt-1 text-xs text-red-600">
              {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-ink">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {errors.lastName && (
            <p id="lastName-error" className="mt-1 text-xs text-red-600">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-ink">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="courseSlug" className="block text-sm font-medium text-ink">
          Selected Course
        </label>
        <select
          id="courseSlug"
          name="courseSlug"
          value={values.courseSlug}
          onChange={(e) => updateCourse(e.target.value)}
          aria-invalid={Boolean(errors.courseSlug)}
          aria-describedby={errors.courseSlug ? "courseSlug-error" : undefined}
          className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title} — {c.price}
            </option>
          ))}
        </select>
        {errors.courseSlug && (
          <p id="courseSlug-error" className="mt-1 text-xs text-red-600">
            {errors.courseSlug}
          </p>
        )}
        {selectedCourse && (
          <p className="mt-2 text-sm text-ink/60">
            <span className="font-semibold text-ink">{selectedCourse.price}</span>
            {selectedCourse.priceNote && <> ({selectedCourse.priceNote})</>} &middot; {selectedCourse.duration} &middot;{" "}
            {selectedCourse.level}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          Message or Questions
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={(e) => setValues((v) => ({ ...v, consent: e.target.checked }))}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/20 text-gold focus:ring-gold"
          />
          I agree to be contacted about this enrollment by phone or email.
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1 text-xs text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Submitting…" : "Submit Enrollment Request"}
      </button>
      <p className="text-xs text-ink/40">
        This is a demo submission. No payment is collected and no request is sent to a live server yet.
      </p>
    </form>
  );
}
