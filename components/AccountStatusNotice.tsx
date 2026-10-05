"use client";

import { useState } from "react";
import Link from "next/link";

export interface AccountStatusView {
  emailVerified: boolean;
  approval: "legacy" | "pending" | "approved" | "rejected";
  wholesale: boolean;
  canCheckout: boolean;
}

/**
 * Explains where a customer's account stands (email verification,
 * administrator approval, wholesale access) and what happens next. Shown
 * on the account overview and at checkout. Renders nothing for an account
 * that's fully set up.
 */
export default function AccountStatusNotice({ status, context = "account" }: { status: AccountStatusView; context?: "account" | "checkout" }) {
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  async function resend() {
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setResendState(res.ok ? "sent" : "error");
      setResendMessage(res.ok ? data.message ?? "A new link is on its way." : data.error ?? "Please try again shortly.");
    } catch {
      setResendState("error");
      setResendMessage("We couldn't reach the server. Please try again.");
    }
  }

  if (status.approval === "rejected") {
    return (
      <div role="status" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p className="font-semibold">Your account application wasn&rsquo;t approved.</p>
        <p className="mt-1">
          Please <Link href="/contact" className="underline">contact us</Link> if you have questions or would like to provide updated certification.
        </p>
      </div>
    );
  }

  const steps: { label: string; done: boolean }[] =
    status.approval === "legacy"
      ? []
      : [
          { label: "Email verified", done: status.emailVerified },
          { label: "Certification approved by Nag's Beauty", done: status.approval === "approved" },
          { label: "Wholesale access enabled", done: status.wholesale },
        ];

  if (status.canCheckout && steps.every((s) => s.done)) return null;

  return (
    <div role="status" className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm text-ink/80">
      <p className="font-semibold text-ink">
        {context === "checkout" ? "Your account isn't ready for checkout yet." : "Your account is being set up."}
      </p>
      {steps.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? "bg-gold text-ink" : "border border-ink/20 text-ink/40"
                }`}
              >
                {step.done ? "✓" : ""}
              </span>
              <span>
                {step.label}
                <span className="sr-only">{step.done ? " — complete" : " — not yet complete"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {!status.emailVerified && status.approval !== "legacy" && (
        <div className="mt-3">
          <p>Please click the verification link we emailed you.</p>
          <button
            type="button"
            onClick={resend}
            disabled={resendState === "sending" || resendState === "sent"}
            className="mt-2 rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-gold disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            {resendState === "sending" ? "Sending…" : "Resend verification email"}
          </button>
          {resendMessage && (
            <p className={`mt-2 text-xs ${resendState === "error" ? "text-red-700" : "text-ink/70"}`} aria-live="polite">
              {resendMessage}
            </p>
          )}
        </div>
      )}
      {status.emailVerified && status.approval === "pending" && (
        <p className="mt-3">Our team is reviewing your certification. We&rsquo;ll email you as soon as your account is approved.</p>
      )}
      {!status.canCheckout && status.approval === "legacy" && (
        <p className="mt-1">Please contact us to enable online ordering for your account.</p>
      )}
    </div>
  );
}
