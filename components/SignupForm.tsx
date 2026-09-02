"use client";

import { useState } from "react";
import { courses } from "@/lib/courses";

export default function SignupForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
        <p className="font-semibold">You&rsquo;re signed up!</p>
        <p className="mt-1 text-sm text-ink/70">
          We&rsquo;ll be in touch about course availability and upcoming dates.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-ink">Full Name</label>
          <input
            id="signup-name"
            required
            type="text"
            name="name"
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label htmlFor="signup-phone" className="block text-sm font-medium text-ink">Phone</label>
          <input
            id="signup-phone"
            type="tel"
            name="phone"
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
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
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>
      <div>
        <label htmlFor="signup-interest" className="block text-sm font-medium text-ink">I&rsquo;m Interested In</label>
        <select
          id="signup-interest"
          name="interest"
          className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
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
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light sm:w-auto"
      >
        Sign Up
      </button>
    </form>
  );
}
