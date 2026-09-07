"use client";

import { useState } from "react";
import { submitNetlifyForm } from "@/lib/netlify-forms";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [botField, setBotField] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;
    if (!email) return;

    if (botField) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      await submitNetlifyForm("footer-newsletter", { "bot-field": botField, email });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="text-sm text-gold-light">
        Thanks for subscribing — watch your inbox for updates.
      </p>
    );
  }

  return (
    // Netlify form *detection* now comes entirely from the static replica
    // in public/__forms.html (per https://opennext.js.org/netlify/forms) —
    // this real form only needs the hidden form-name field below, which is
    // what actually gets POSTed by handleSubmit.
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <input type="hidden" name="form-name" value="footer-newsletter" />

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="footer-newsletter-bot-field">Leave this field empty</label>
        <input
          id="footer-newsletter-bot-field"
          name="bot-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={botField}
          onChange={(e) => setBotField(e.target.value)}
        />
      </div>

      {/* Stacked below sm: an <input> has a browser-default intrinsic
          minimum width that a bare `flex` row won't shrink below without
          `min-w-0`, so a same-row input + button here overflowed a narrow
          parent. Stacking avoids that entirely. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full min-w-0 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-cream placeholder:text-white/40 outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
