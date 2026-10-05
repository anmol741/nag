import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/server/wp-auth";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { forbiddenOriginResponse, tooManyRequestsResponse } from "@/lib/server/require-session";
import { isValidCanadianPhone, isValidEmail, isValidPassword, normalizeEmail, normalizePhone } from "@/lib/validation";
import { MAX_CERTIFICATION_BYTES, safeDisplayFileName, validateCertificationFile } from "@/lib/security/upload";
import { business } from "@/lib/site-config";

const UNAVAILABLE_MESSAGE = `Online registration is temporarily unavailable. Please try again shortly, or call ${business.phone}.`;
// File limit + generous room for the text fields and multipart framing.
const MAX_REQUEST_BYTES = MAX_CERTIFICATION_BYTES + 256 * 1024;

function text(form: FormData, key: string, max = 120): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`register:ip:${ip}`, 5, 60 * 60);
  if (!rateLimit.allowed) return tooManyRequestsResponse(rateLimit.retryAfterSeconds);

  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "The certification file is too large. Please upload a file under 4 MB.", fieldErrors: { certification: "File must be under 4 MB." } },
      { status: 413 }
    );
  }
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = text(form, "firstName");
  const lastName = text(form, "lastName");
  const email = text(form, "email", 254);
  const phone = text(form, "phone", 30);
  const salonName = text(form, "salonName", 150);
  const passwordRaw = form.get("password");
  const confirmRaw = form.get("confirmPassword");
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  const confirmPassword = typeof confirmRaw === "string" ? confirmRaw : "";
  const agreedToTerms = form.get("agreedToTerms") === "true";
  const file = form.get("certification");

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!email || !isValidEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!phone || !isValidCanadianPhone(phone)) fieldErrors.phone = "Enter a valid Canadian phone number.";
  if (!salonName) fieldErrors.salonName = "Salon/spa name is required.";
  if (!isValidPassword(password) || password.length > 200) {
    fieldErrors.password = "Password must be 8–200 characters and include a letter and a number.";
  }
  if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (!agreedToTerms) fieldErrors.agreedToTerms = "You must agree to the Privacy Policy and Terms and Conditions.";

  let certification: { fileName: string; mimeType: string; extension: string; base64: string } | null = null;
  if (!(file instanceof File) || file.size === 0) {
    fieldErrors.certification = "Please upload your certification document or photo.";
  } else if (file.size > MAX_CERTIFICATION_BYTES) {
    fieldErrors.certification = "The file is too large. Please upload a file under 4 MB.";
  } else {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateCertificationFile({ name: file.name, type: file.type, size: file.size, bytes });
    if (!check.ok) {
      fieldErrors.certification = check.error;
    } else {
      certification = {
        fileName: safeDisplayFileName(file.name),
        mimeType: check.mimeType,
        extension: check.extension,
        base64: Buffer.from(bytes).toString("base64"),
      };
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !certification) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const outcome = await registerCustomer(
    {
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizePhone(phone),
      salonName,
      password,
      agreedToTermsAt: new Date().toISOString(),
      certification,
    },
    ip
  );

  if (outcome.ok) {
    // Not logged in automatically: the account must verify its email and be
    // approved by Nag's Beauty before wholesale access is enabled.
    return NextResponse.json({ ok: true });
  }

  switch (outcome.reason) {
    case "duplicate_email":
      // Registration inherently has to say the email is taken (WooCommerce
      // enforces unique emails). Login and password reset stay non-disclosing.
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in, or reset your password.", fieldErrors: { email: "Email already registered." } },
        { status: 409 }
      );
    case "invalid":
      return NextResponse.json({ error: outcome.message, fieldErrors: outcome.fieldErrors ?? {} }, { status: 400 });
    case "rate_limited":
      return tooManyRequestsResponse();
    default:
      console.warn("[auth/register] bridge unavailable");
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
  }
}
