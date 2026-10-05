"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CERTIFICATION_ACCEPT_ATTRIBUTE, MAX_CERTIFICATION_BYTES } from "@/lib/security/upload";

type Status = "idle" | "loading" | "success" | "error" | "unavailable";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  salonName: string;
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
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

export default function RegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFieldErrors((errors) => ({ ...errors, certification: "" }));
    // Instant feedback only — the server re-validates type, contents and size.
    if (selected && selected.size > MAX_CERTIFICATION_BYTES) {
      setFieldErrors((errors) => ({ ...errors, certification: "The file is too large. Please upload a file under 4 MB." }));
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return; // ignore double-clicks
    submitting.current = true;
    setFieldErrors({});
    setStatus("loading");

    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.append(key, String(value));
    if (file) form.append("certification", file);

    try {
      // No Content-Type header: the browser sets the multipart boundary.
      const res = await fetch("/api/auth/register", { method: "POST", body: form });
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
    } finally {
      submitting.current = false;
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
        <p className="font-semibold">Registration received — please check your email</p>
        <p className="mt-2 text-sm text-ink/70">
          We&rsquo;ve sent a verification link to <strong>{values.email}</strong>. After you verify your email, our team will review your
          certification. Wholesale access is enabled once your account is approved — we&rsquo;ll email you when that happens.
        </p>
        <p className="mt-3 text-sm text-ink/70">
          You can{" "}
          <Link href="/account" className="font-semibold text-gold-dark hover:underline">
            log in
          </Link>{" "}
          any time to check your account status.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Create Account</h2>
      <p className="mt-2 text-sm text-ink/60">
        Accounts are for beauty professionals. New accounts are reviewed by our team before wholesale access is enabled.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" id="register-first-name" autoComplete="given-name" value={values.firstName} onChange={(v) => set("firstName", v)} error={fieldErrors.firstName} />
          <Field label="Last Name" id="register-last-name" autoComplete="family-name" value={values.lastName} onChange={(v) => set("lastName", v)} error={fieldErrors.lastName} />
        </div>

        <Field label="Email Address" id="register-email" type="email" autoComplete="email" value={values.email} onChange={(v) => set("email", v)} error={fieldErrors.email} />
        <Field label="Phone Number" id="register-phone" type="tel" autoComplete="tel" value={values.phone} onChange={(v) => set("phone", v)} error={fieldErrors.phone} placeholder="(778) 278-7727" />
        <Field label="Salon/Spa Name" id="register-salon" autoComplete="organization" value={values.salonName} onChange={(v) => set("salonName", v)} error={fieldErrors.salonName} />

        <div>
          <label htmlFor="register-certification" className="block text-sm font-medium text-ink">
            Certification Document or Photo
          </label>
          <input
            id="register-certification"
            name="certification"
            type="file"
            accept={CERTIFICATION_ACCEPT_ATTRIBUTE}
            required
            onChange={handleFile}
            aria-invalid={Boolean(fieldErrors.certification)}
            aria-describedby={`register-certification-help${fieldErrors.certification ? " register-certification-error" : ""}`}
            className="mt-1 block w-full rounded-md border border-ink/15 px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
          />
          <p id="register-certification-help" className="mt-1 text-xs text-ink/50">
            PDF, JPG, PNG, WEBP or HEIC, up to 4 MB. Only our team can view this file.
          </p>
          {fieldErrors.certification && (
            <p id="register-certification-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.certification}
            </p>
          )}
        </div>

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

        <div>
          <label className="flex items-start gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={values.agreedToTerms}
              onChange={(e) => set("agreedToTerms", e.target.checked)}
              aria-invalid={Boolean(fieldErrors.agreedToTerms)}
              aria-describedby={fieldErrors.agreedToTerms ? "register-terms-error" : undefined}
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
          {fieldErrors.agreedToTerms && (
            <p id="register-terms-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.agreedToTerms}
            </p>
          )}
        </div>

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
