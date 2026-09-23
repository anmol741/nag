"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANADIAN_PROVINCES } from "@/lib/canadian-provinces";

export interface AddressFormValues {
  firstName: string;
  lastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

const emptyAddress: AddressFormValues = {
  firstName: "",
  lastName: "",
  company: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
};

function toFormValues(address?: {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string;
}): AddressFormValues {
  if (!address) return emptyAddress;
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? "",
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    phone: address.phone ?? "",
  };
}

type Status = "idle" | "saving" | "saved" | "error" | "unavailable";

export default function AddressesForm({
  initialBilling,
  initialShipping,
}: {
  initialBilling?: Parameters<typeof toFormValues>[0];
  initialShipping?: Parameters<typeof toFormValues>[0];
}) {
  const router = useRouter();
  const [billing, setBilling] = useState<AddressFormValues>(toFormValues(initialBilling));
  const [shipping, setShipping] = useState<AddressFormValues>(toFormValues(initialShipping ?? initialBilling));
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setFieldErrors({});
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing, shipping: sameAsBilling ? billing : shipping }),
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
    <form onSubmit={handleSubmit} className="space-y-10">
      <fieldset>
        <legend className="font-display text-xl text-ink">Billing Address</legend>
        <AddressBlock prefix="billing" values={billing} onChange={setBilling} errors={fieldErrors} />
      </fieldset>

      <fieldset>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={sameAsBilling}
            onChange={(e) => setSameAsBilling(e.target.checked)}
            className="h-4 w-4 rounded border-ink/20 text-gold focus:ring-gold"
          />
          Shipping address is the same as billing
        </label>
        {!sameAsBilling && (
          <div className="mt-4">
            <legend className="font-display text-xl text-ink">Shipping Address</legend>
            <AddressBlock prefix="shipping" values={shipping} onChange={setShipping} errors={fieldErrors} />
          </div>
        )}
      </fieldset>

      <div aria-live="polite">
        {status === "saved" && (
          <p role="status" className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-ink/70">
            Addresses saved.
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
        {status === "saving" ? "Saving…" : "Save Addresses"}
      </button>
    </form>
  );
}

function AddressBlock({
  prefix,
  values,
  onChange,
  errors,
}: {
  prefix: "billing" | "shipping";
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
  errors: Record<string, string>;
}) {
  function set<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const err = (field: string) => errors[`${prefix}${field}`];

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <TextField id={`${prefix}-first-name`} label="First Name" value={values.firstName} onChange={(v) => set("firstName", v)} error={err("FirstName")} />
      <TextField id={`${prefix}-last-name`} label="Last Name" value={values.lastName} onChange={(v) => set("lastName", v)} error={err("LastName")} />
      <TextField id={`${prefix}-address-1`} label="Address Line 1" full value={values.addressLine1} onChange={(v) => set("addressLine1", v)} error={err("AddressLine1")} />
      <TextField id={`${prefix}-address-2`} label="Address Line 2 (optional)" full value={values.addressLine2} onChange={(v) => set("addressLine2", v)} />
      <TextField id={`${prefix}-city`} label="City" value={values.city} onChange={(v) => set("city", v)} error={err("City")} />
      <div>
        <label htmlFor={`${prefix}-province`} className="block text-sm font-medium text-ink">
          Province
        </label>
        <select
          id={`${prefix}-province`}
          required
          value={values.province}
          onChange={(e) => set("province", e.target.value)}
          className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="" disabled>
            Select a province
          </option>
          {CANADIAN_PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        {err("Province") && <p className="mt-1 text-xs text-red-600">{err("Province")}</p>}
      </div>
      <TextField id={`${prefix}-postal-code`} label="Postal Code" value={values.postalCode} onChange={(v) => set("postalCode", v)} error={err("PostalCode")} placeholder="A1A 1A1" />
      <div>
        <label htmlFor={`${prefix}-country`} className="block text-sm font-medium text-ink">
          Country
        </label>
        <select
          id={`${prefix}-country`}
          value="CA"
          onChange={() => {}}
          className="mt-1 w-full cursor-default rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none"
        >
          <option value="CA">Canada</option>
        </select>
      </div>
      <TextField id={`${prefix}-phone`} label="Phone (optional)" value={values.phone} onChange={(v) => set("phone", v)} error={err("Phone")} />
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  full = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  full?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
