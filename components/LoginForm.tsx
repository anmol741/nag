"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "info" | "error";

const infoMessage =
  "Account connection coming soon — customer login will become active after WooCommerce integration.";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      // No WooCommerce authentication backend is connected yet, so this
      // never creates a session — it only surfaces the info message below.
      // Integration point: replace this with a real login API call (e.g.
      // `await fetch("/api/auth/login", { method: "POST", body: ... })`)
      // and call `setSession(...)` from `lib/auth` on success.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStatus("info");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Log In</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="login-identifier" className="block text-sm font-medium text-ink">
            Email or Username
          </label>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 text-gold focus:ring-gold focus-visible:ring-2 focus-visible:ring-gold/40"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setStatus("info")}
            className="text-sm text-gold-dark underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            Lost your password?
          </button>
        </div>

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
          className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {status === "loading" ? "Checking…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
