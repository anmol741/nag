"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "info" | "error";

const infoMessage =
  "Account connection coming soon — registration will become active after WooCommerce integration.";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      // No WooCommerce customer-registration backend is connected yet, so
      // this never creates an account — it only surfaces the info message
      // below. Integration point: replace this with a real registration
      // API call and `setSession(...)` from `lib/auth` on success.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStatus("info");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Create Account</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-ink">
            Email Address
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <p className="text-xs text-ink/50">
          Your personal data will be used to support your experience on this site, to manage
          access to your account, and for other purposes described in our privacy policy.
        </p>

        <div aria-live="polite">
          {status === "info" && (
            <p role="status" className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-ink/70">
              {infoMessage}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Something went wrong. Please try again shortly.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {status === "loading" ? "Creating…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
