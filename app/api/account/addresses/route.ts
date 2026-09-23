import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/require-session";
import { updateCustomerAddresses, type Address } from "@/lib/server/woocommerce-admin";
import { verifySameOrigin } from "@/lib/server/csrf";
import { isValidCanadianPhone, isValidCanadianPostalCode, normalizeCanadianPostalCode, normalizePhone } from "@/lib/validation";

const CANADIAN_PROVINCE_CODES = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);

interface AddressBody {
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  province?: unknown;
  postalCode?: unknown;
  phone?: unknown;
}

function parseAddress(raw: unknown, prefix: string, errors: Record<string, string>): Address | null {
  const b = (raw ?? {}) as AddressBody;
  const firstName = typeof b.firstName === "string" ? b.firstName.trim() : "";
  const lastName = typeof b.lastName === "string" ? b.lastName.trim() : "";
  const company = typeof b.company === "string" ? b.company.trim() : "";
  const addressLine1 = typeof b.addressLine1 === "string" ? b.addressLine1.trim() : "";
  const addressLine2 = typeof b.addressLine2 === "string" ? b.addressLine2.trim() : "";
  const city = typeof b.city === "string" ? b.city.trim() : "";
  const province = typeof b.province === "string" ? b.province.trim().toUpperCase() : "";
  const postalCode = typeof b.postalCode === "string" ? b.postalCode.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";

  // Collected in a scratch object first — `errors` is shared across both
  // the billing and shipping calls (to accumulate one combined field-error
  // map), so checking its overall size here would wrongly fail shipping
  // just because billing already added an unrelated error.
  const ownErrors: Record<string, string> = {};
  if (!firstName) ownErrors[`${prefix}FirstName`] = "First name is required.";
  if (!lastName) ownErrors[`${prefix}LastName`] = "Last name is required.";
  if (!addressLine1) ownErrors[`${prefix}AddressLine1`] = "Street address is required.";
  if (!city) ownErrors[`${prefix}City`] = "City is required.";
  if (!CANADIAN_PROVINCE_CODES.has(province)) ownErrors[`${prefix}Province`] = "Select a valid Canadian province.";
  if (!isValidCanadianPostalCode(postalCode)) ownErrors[`${prefix}PostalCode`] = "Enter a valid Canadian postal code.";
  if (phone && !isValidCanadianPhone(phone)) ownErrors[`${prefix}Phone`] = "Enter a valid Canadian phone number.";

  Object.assign(errors, ownErrors);
  if (Object.keys(ownErrors).length > 0) return null;

  return {
    firstName,
    lastName,
    company: company || undefined,
    addressLine1,
    addressLine2: addressLine2 || undefined,
    city,
    province,
    postalCode: normalizeCanadianPostalCode(postalCode),
    country: "CA",
    phone: phone ? normalizePhone(phone) : undefined,
  };
}

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  let body: { billing?: unknown; shipping?: unknown };
  try {
    body = (await request.json()) as { billing?: unknown; shipping?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fieldErrors: Record<string, string> = {};
  const billing = parseAddress(body.billing, "billing", fieldErrors);
  const shipping = parseAddress(body.shipping ?? body.billing, "shipping", fieldErrors);

  if (!billing || !shipping || Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const result = await updateCustomerAddresses(guard.session.sub, { billing, shipping });

  if (result.ok) return NextResponse.json({ ok: true });
  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: "Address updates aren't connected yet. Please call (778) 278-7727.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ error: "We couldn't save your addresses right now. Please try again shortly." }, { status: 502 });
}
