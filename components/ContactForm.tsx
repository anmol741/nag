"use client";

import { useState } from "react";
import { submitNetlifyForm } from "@/lib/netlify-forms";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [values, setValues] = useState({ name: "", phone: "", email: "", message: "", botField: "" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Prevent duplicate submissions from a double-click or a repeat Enter press.
    if (status === "loading" || status === "success") return;

    // Netlify's own honeypot convention: a hidden field real visitors never
    // fill in. Netlify silently discards submissions where it's non-empty,
    // but we also skip the network call entirely for a snappier no-op.
    if (values.botField) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      await submitNetlifyForm("contact", {
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: values.message,
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
    <form
      name="contact"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input type="hidden" name="form-name" value="contact" />

      {/* Honeypot: hidden from sighted and screen-reader users, but visible to most bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="contact-bot-field">Leave this field empty</label>
        <input
          id="contact-bot-field"
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
          <label htmlFor="contact-name" className="block text-sm font-medium text-ink">Name</label>
          <input
            id="contact-name"
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
          <label htmlFor="contact-phone" className="block text-sm font-medium text-ink">Phone</label>
          <input
            id="contact-phone"
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
        <label htmlFor="contact-email" className="block text-sm font-medium text-ink">Email</label>
        <input
          id="contact-email"
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
        <label htmlFor="contact-message" className="block text-sm font-medium text-ink">Message</label>
        <textarea
          id="contact-message"
          required
          name="message"
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
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
