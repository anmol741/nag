"use client";

import { useState } from "react";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [website, setWebsite] = useState(""); // honeypot

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot: bots tend to fill every field, including ones hidden from
    // real users via CSS. A silent success avoids tipping them off.
    if (website) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      // Demo-only submission — no backend is connected yet.
      // Integration point: replace this with a POST to a real contact API
      // once a form backend is available.
      await new Promise((resolve) => setTimeout(resolve, 600));
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
          We couldn&rsquo;t send your message. Please try again, or call us directly at{" "}
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
        <p className="font-semibold">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-ink/70">
          We&rsquo;ve received your message and will get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot: hidden from sighted and screen-reader users, but visible to most bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

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
        disabled={status === "loading"}
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
