import { NextResponse } from "next/server";
import { forbiddenOriginResponse, requireSession } from "@/lib/server/require-session";
import { updateCustomerDetails } from "@/lib/server/woocommerce-admin";
import { verifySameOrigin } from "@/lib/server/csrf";
import { isValidCanadianPhone, normalizePhone } from "@/lib/validation";

interface DetailsBody {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  salonName?: unknown;
}

function str(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const guard = await requireSession();
  if ("response" in guard) return guard.response;

  let body: DetailsBody;
  try {
    body = (await request.json()) as DetailsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const phone = str(body.phone, 30);
  const salonName = str(body.salonName, 150);

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!phone || !isValidCanadianPhone(phone)) fieldErrors.phone = "Enter a valid Canadian phone number.";
  if (!salonName) fieldErrors.salonName = "Salon/spa name is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const result = await updateCustomerDetails(guard.session.sub, { firstName, lastName, phone: normalizePhone(phone), salonName });

  if (result.ok) return NextResponse.json({ ok: true });
  if (result.reason === "service_unavailable") {
    return NextResponse.json({ error: "Account updates aren't available right now. Please call (778) 278-7727.", unavailable: true }, { status: 503 });
  }
  return NextResponse.json({ error: "We couldn't save your details right now. Please try again shortly." }, { status: 502 });
}
