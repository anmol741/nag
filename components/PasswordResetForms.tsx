"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40";
const buttonClass =
  "w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40";

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> } }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };
  return { ok: res.ok && Boolean(data.ok), data };
}

/** Requests a reset link. Always shows the same confirmation — never reveals whether the email has an account. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const { ok, data } = await postJson("/api/auth/forgot-password", { email });
      setState(ok ? "done" : "error");
      setMessage(ok ? data.message ?? "" : data.error ?? "Something went wrong. Please try again shortly.");
    } catch {
      setState("error");
      setMessage("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-sm text-ink/80">
        <p>{message}</p>
        <p className="mt-3">
          <Link href="/account" className="font-semibold text-gold-dark hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-sm text-ink/60">Enter the email address on your account and we&rsquo;ll send you a link to choose a new password.</p>
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-ink">
          Email Address
        </label>
        <input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div aria-live="polite">
        {state === "error" && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}
      </div>
      <button type="submit" disabled={state === "loading"} className={buttonClass}>
        {state === "loading" ? "Sending…" : "Send Reset Link"}
      </button>
    </form>
  );
}

/** Sets a new password using WordPress's reset key from the emailed link. */
export function ResetPasswordForm({ login, resetKey }: { login: string; resetKey: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setState("loading");
    setFieldErrors({});
    try {
      const { ok, data } = await postJson("/api/auth/reset-password", { login, key: resetKey, password, confirmPassword });
      if (ok) {
        router.push("/account?reset=1");
        router.refresh();
        return;
      }
      setState("error");
      setFieldErrors(data.fieldErrors ?? {});
      setMessage(data.error ?? "Something went wrong. Please try again shortly.");
    } catch {
      setState("error");
      setMessage("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="reset-password" className="block text-sm font-medium text-ink">
          New Password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="reset-password-help"
          className={inputClass}
        />
        <p id="reset-password-help" className="mt-1 text-xs text-ink/50">
          {fieldErrors.password ?? "At least 8 characters, with a letter and a number."}
        </p>
      </div>
      <div>
        <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-ink">
          Confirm New Password
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          className={inputClass}
        />
        {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
      </div>
      <div aria-live="polite">
        {state === "error" && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}{" "}
            <Link href="/account/forgot-password" className="underline">
              Request a new link
            </Link>
          </p>
        )}
      </div>
      <button type="submit" disabled={state === "loading"} className={buttonClass}>
        {state === "loading" ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

/** Confirms an email-verification link. Requires a click (POST) so email-client link scanners can't consume the token. */
export function VerifyEmailPanel({ uid, token }: { uid: string; token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function verify() {
    if (state === "loading") return;
    setState("loading");
    try {
      const { ok, data } = await postJson("/api/auth/verify-email", { uid, token });
      if (ok) {
        router.push("/account?verified=1");
        router.refresh();
        return;
      }
      setState("error");
      setMessage(data.error ?? "Something went wrong. Please try again shortly.");
    } catch {
      setState("error");
      setMessage("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-ink/70">Click below to confirm this is your email address.</p>
      <button type="button" onClick={verify} disabled={state === "loading"} className={buttonClass}>
        {state === "loading" ? "Verifying…" : "Verify My Email"}
      </button>
      <div aria-live="polite">
        {state === "error" && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
