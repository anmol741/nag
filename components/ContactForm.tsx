"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
        <p className="font-semibold">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-ink/70">
          We&rsquo;ve received your message and will get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-ink">Name</label>
          <input
            id="contact-name"
            required
            type="text"
            name="name"
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-ink">Phone</label>
          <input
            id="contact-phone"
            type="tel"
            name="phone"
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-ink">Email</label>
        <input
          id="contact-email"
          required
          type="email"
          name="email"
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-ink">Message</label>
        <textarea
          id="contact-message"
          required
          name="message"
          rows={5}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light sm:w-auto"
      >
        Send Message
      </button>
    </form>
  );
}
