"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initial {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  salonName: string;
  certification: string;
}

type Status = "idle" | "saving" | "saved" | "error" | "unavailable";

export default function AccountDetailsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [salonName, setSalonName] = useState(initial.salonName);
  const [certification, setCertification] = useState(initial.certification);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setFieldErrors({});
    try {
      const res = await fetch("/api/account/details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, salonName, certification }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; unavailable?: boolean; fieldErrors?: Record<string, string> };

      if (res.ok && data.ok) {
        setStatus("saved");
        router.refresh();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="details-email" className="block text-sm font-medium text-ink">
          Email Address
        </label>
        <input
          id="details-email"
          type="email"
          value={initial.email}
          readOnly
          disabled
          className="mt-1 w-full cursor-not-allowed rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink/60 outline-none"
        />
        <p className="mt-1 text-xs text-ink/50">
          Email changes aren&rsquo;t supported here yet — call us if you need to update the email on your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="details-first-name" label="First Name" value={firstName} onChange={setFirstName} error={fieldErrors.firstName} />
        <Field id="details-last-name" label="Last Name" value={lastName} onChange={setLastName} error={fieldErrors.lastName} />
      </div>
      <Field id="details-phone" label="Phone Number" value={phone} onChange={setPhone} error={fieldErrors.phone} />
      <Field id="details-salon" label="Salon/Spa Name" value={salonName} onChange={setSalonName} error={fieldErrors.salonName} />
      <Field id="details-certification" label="Certification" value={certification} onChange={setCertification} error={fieldErrors.certification} />

      <div aria-live="polite">
        {status === "saved" && (
          <p role="status" className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-ink/70">
            Details saved.
          </p>
        )}
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
        disabled={status === "saving"}
        className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save Details"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
