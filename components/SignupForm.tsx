"use client";

import { useState } from "react";
import { courses } from "@/lib/courses";
import { submitNetlifyForm } from "@/lib/netlify-forms";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function SignupForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    interest: "newsletter",
    notes: "",
    botField: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Prevent duplicate submissions from a double-click or a repeat Enter press.
    if (status === "loading" || status === "success") return;

    if (values.botField) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      await submitNetlifyForm("newsletter-course-updates", {
        "bot-field": values.botField,
        name: values.name,
        phone: values.phone,
        email: values.email,
        interest: values.interest,
        notes: values.notes,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "error") {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-ink">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-1 text-sm text-ink/70">
          We couldn&rsquo;t submit that. Please try again, or call us at{" "}
          <a href="tel:+17782787727" className="font-semibold text-gold-dark hover:underline">
            (778) 278-7727
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
        <p className="font-semibold">You&rsquo;re on the list!</p>
        <p className="mt-1 text-sm text-ink/70">
          We&rsquo;ll be in touch about course availability, dates, and news from Nag&rsquo;s.
        </p>
      </div>
    );
  }

  return (
    // Netlify form *detection* now comes entirely from the static replica
    // in public/__forms.html (per https://opennext.js.org/netlify/forms) —
    // this real form only needs the hidden form-name field below, which is
    // what actually gets POSTed by handleSubmit.
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="form-name" value="newsletter-course-updates" />

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="newsletter-bot-field">Leave this field empty</label>
        <input
          id="newsletter-bot-field"
          name="bot-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.botField}
          onChange={(e) => setValues((v) => ({ ...v, botField: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-ink">Full Name</label>
          <input
            id="signup-name"
            required
            type="text"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>
        <div>
          <label htmlFor="signup-phone" className="block text-sm font-medium text-ink">Phone</label>
          <input
            id="signup-phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>
      </div>
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-ink">Email</label>
        <input
          id="signup-email"
          required
          type="email"
          name="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
        />
      </div>
      <div>
        <label htmlFor="signup-interest" className="block text-sm font-medium text-ink">I&rsquo;m Interested In</label>
        <select
          id="signup-interest"
          name="interest"
          value={values.interest}
          onChange={(e) => setValues((v) => ({ ...v, interest: e.target.value }))}
          className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          <option value="newsletter">General Newsletter</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="signup-notes" className="block text-sm font-medium text-ink">Notes (optional)</label>
        <textarea
          id="signup-notes"
          name="notes"
          rows={4}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Submitting…" : "Subscribe"}
      </button>
    </form>
  );
}
