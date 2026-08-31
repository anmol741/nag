"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-sm text-gold-light">Thanks for subscribing — watch your inbox for updates.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-cream placeholder:text-white/40 focus:border-gold outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-light"
      >
        Subscribe
      </button>
    </form>
  );
}
