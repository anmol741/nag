"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import ETransferInstructions from "./ETransferInstructions";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

interface Props {
  courseSlug: string;
  courseTitle: string;
  coursePrice: string;
  depositAmount?: string;
}

interface Placed {
  orderNumber: string;
  amountDue: string;
  remainingBalance: string;
}

const inputClass =
  "mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40";

/** Course payment request (full fee or deposit) by e-Transfer. Amounts shown are informational — the server takes the course price from its own data and the deposit from WordPress settings. */
export default function CoursePaymentForm({ courseSlug, courseTitle, coursePrice, depositAmount }: Props) {
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Placed | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading") return;
    idempotencyKey.current ??= crypto.randomUUID();
    setState("loading");
    setFieldErrors({});
    try {
      const res = await fetch("/api/courses/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, courseSlug, paymentType, acceptedPolicy, idempotencyKey: idempotencyKey.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; order?: Placed; error?: string; fieldErrors?: Record<string, string> };
      if (res.ok && data.ok && data.order) {
        setPlaced(data.order);
        return;
      }
      setState("error");
      setFieldErrors(data.fieldErrors ?? {});
      setMessage(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setState("error");
      setMessage("We couldn't reach the server. Please try again — retrying won't create a duplicate.");
    }
  }

  if (placed) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-6 text-ink">
          <p className="font-display text-2xl">Enrollment received</p>
          <p className="mt-2 text-sm text-ink/70">
            Your request #{placed.orderNumber} for <strong>{courseTitle}</strong> has been received. A confirmation has been emailed to{" "}
            {values.email}.
          </p>
          {(Number.parseFloat(placed.remainingBalance) || 0) > 0 && (
            <p className="mt-2 text-sm text-ink/70">Remaining balance after this payment: {currency.format(Number.parseFloat(placed.remainingBalance))}.</p>
          )}
        </div>
        <ETransferInstructions amount={Number.parseFloat(placed.amountDue) || 0} orderNumber={placed.orderNumber} />
      </div>
    );
  }

  const field = (key: keyof typeof values, label: string, type = "text", autoComplete?: string) => (
    <div>
      <label htmlFor={`course-pay-${key}`} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={`course-pay-${key}`}
        type={type}
        autoComplete={autoComplete}
        required
        value={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
        aria-invalid={Boolean(fieldErrors[key])}
        className={inputClass}
      />
      {fieldErrors[key] && <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "Student First Name", "text", "given-name")}
        {field("lastName", "Student Last Name", "text", "family-name")}
        {field("email", "Email", "email", "email")}
        {field("phone", "Phone", "tel", "tel")}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-ink">Payment</legend>
        <div className="mt-2 space-y-2">
          <label className={`flex items-center gap-3 rounded-md border p-3 text-sm ${paymentType === "full" ? "border-gold bg-cream" : "border-ink/15"}`}>
            <input type="radio" name="paymentType" value="full" checked={paymentType === "full"} onChange={() => setPaymentType("full")} className="h-4 w-4 text-gold focus:ring-gold" />
            <span>
              Full course fee — <strong>{currency.format(Number.parseFloat(coursePrice))}</strong>
            </span>
          </label>
          {depositAmount && (
            <label className={`flex items-center gap-3 rounded-md border p-3 text-sm ${paymentType === "deposit" ? "border-gold bg-cream" : "border-ink/15"}`}>
              <input type="radio" name="paymentType" value="deposit" checked={paymentType === "deposit"} onChange={() => setPaymentType("deposit")} className="h-4 w-4 text-gold focus:ring-gold" />
              <span>
                Deposit — <strong>{currency.format(Number.parseFloat(depositAmount))}</strong>{" "}
                <span className="text-ink/60">(balance of {currency.format(Number.parseFloat(coursePrice) - Number.parseFloat(depositAmount))} due before the course)</span>
              </span>
            </label>
          )}
        </div>
        {fieldErrors.paymentType && <p className="mt-1 text-xs text-red-600">{fieldErrors.paymentType}</p>}
      </fieldset>

      <div className="rounded-md border border-ink/10 bg-cream p-4 text-xs text-ink/70">
        <p className="font-semibold text-ink">Key course policy terms</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Transfer requests must be submitted at least 7 days before the course. Only one transfer is allowed.</li>
          <li>Student kits are non-refundable once picked up or opened. Unopened kits returned within 7 days may be considered for a partial refund.</li>
          <li>No refunds are provided for missed classes, lateness or personal scheduling conflicts.</li>
        </ul>
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={acceptedPolicy}
            onChange={(e) => setAcceptedPolicy(e.target.checked)}
            aria-invalid={Boolean(fieldErrors.acceptedPolicy)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/20 text-gold focus:ring-gold"
          />
          <span>
            I have read and accept the{" "}
            <Link href="/training-course-policy" className="text-gold-dark hover:underline">
              Training Course Registration, Cancellation &amp; Refund Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors.acceptedPolicy && <p className="mt-1 text-xs text-red-600">{fieldErrors.acceptedPolicy}</p>}
      </div>

      <ETransferInstructions />

      <div aria-live="polite">
        {state === "error" && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gold/40 sm:w-auto"
      >
        {state === "loading" ? "Submitting…" : "Submit and Pay by e-Transfer"}
      </button>
    </form>
  );
}
