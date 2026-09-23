"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error" | "unavailable";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  salonName: string;
  certification: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  salonName: "",
  certification: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

export default function RegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        unavailable?: boolean;
        fieldErrors?: Record<string, string>;
      };

      if (res.ok && data.ok) {
        setStatus("success");
        return;
      }

      setFieldErrors(data.fieldErrors ?? {});
      setStatus(data.unavailable ? "unavailable" : "error");
      setMessage(data.error || "Something went wrong. Please try again shortly.");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
        <p className="font-semibold">Account created</p>
        <p className="mt-1 text-sm text-ink/70">
          You can now{" "}
          <Link href="/account" className="font-semibold text-gold-dark hover:underline">
            log in
          </Link>{" "}
          with your new account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Create Account</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" id="register-first-name" autoComplete="given-name" value={values.firstName} onChange={(v) => set("firstName", v)} error={fieldErrors.firstName} />
          <Field label="Last Name" id="register-last-name" autoComplete="family-name" value={values.lastName} onChange={(v) => set("lastName", v)} error={fieldErrors.lastName} />
        </div>

        <Field label="Email Address" id="register-email" type="email" autoComplete="email" value={values.email} onChange={(v) => set("email", v)} error={fieldErrors.email} />
        <Field label="Phone Number" id="register-phone" type="tel" autoComplete="tel" value={values.phone} onChange={(v) => set("phone", v)} error={fieldErrors.phone} placeholder="(778) 278-7727" />
        <Field label="Salon/Spa Name" id="register-salon" value={values.salonName} onChange={(v) => set("salonName", v)} error={fieldErrors.salonName} />
        <Field
          label="Certification"
          id="register-certification"
          value={values.certification}
          onChange={(v) => set("certification", v)}
          error={fieldErrors.certification}
          placeholder="e.g. Esthetician, PMU, Laser Technician"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" id="register-password" type="password" autoComplete="new-password" value={values.password} onChange={(v) => set("password", v)} error={fieldErrors.password} />
          <Field
            label="Confirm Password"
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
            error={fieldErrors.confirmPassword}
          />
        </div>
        <p className="text-xs text-ink/50">At least 8 characters, with a letter and a number.</p>

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={values.agreedToTerms}
            onChange={(e) => set("agreedToTerms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-gold focus:ring-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
          <span>
            I agree to the{" "}
            <Link href="/privacy-policy" className="text-gold-dark hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms-and-conditions" className="text-gold-dark hover:underline">
              Terms and Conditions
            </Link>
            .
          </span>
        </label>
        {fieldErrors.agreedToTerms && <p className="text-xs text-red-600">{fieldErrors.agreedToTerms}</p>}

        <p className="text-xs text-ink/50">
          Your personal data will be used to support your experience on this site, to manage access to your account,
          and for other purposes described in our privacy policy. We won&rsquo;t add you to our newsletter unless you
          sign up separately.
        </p>

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
          {status === "loading" ? "Creating…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
