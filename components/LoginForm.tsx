"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { business } from "@/lib/site-config";

type Status = "idle" | "loading" | "error" | "unavailable";

// WordPress's own hosted, built-in password-reset flow — this link leaves
// the Next.js app entirely and never touches our server, which is exactly
// the "approved WordPress password-reset flow" this phase requires rather
// than a custom-built reset system. Same store domain lib/woocommerce.ts
// already talks to server-side; hardcoded here too since this is a client
// component (no server-only env var can reach it).
const WORDPRESS_LOST_PASSWORD_URL = "https://nagsbeautysupply.com/wp-login.php?action=lostpassword";

/** `returnTo` is already validated server-side by the page that renders this (see app/account/page.tsx) — this component trusts it as-is rather than re-validating client-side. */
export default function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; unavailable?: boolean };

      if (res.ok && data.ok) {
        router.push(returnTo ?? "/account");
        router.refresh();
        return;
      }

      setStatus(data.unavailable ? "unavailable" : "error");
      setMessage(data.error || "Something went wrong. Please try again shortly.");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Log In</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-ink">
            Email Address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <a
            href={WORDPRESS_LOST_PASSWORD_URL}
            className="text-sm text-gold-dark underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            Lost your password?
          </a>
        </div>

        <div aria-live="polite">
          {status === "unavailable" && (
            <p role="status" className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-ink/70">
              {message}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {status === "loading" ? "Logging in…" : "Log In"}
        </button>

        <p className="text-center text-xs text-ink/50">
          Prefer to order by phone? Call{" "}
          <a href={business.phoneHref} className="text-gold-dark hover:underline">
            {business.phone}
          </a>
          .
        </p>
      </form>
    </div>
  );
}
