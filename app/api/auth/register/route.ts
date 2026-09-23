import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/server/wp-auth";
import { verifySameOrigin } from "@/lib/server/csrf";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { isValidCanadianPhone, isValidEmail, isValidPassword, normalizeEmail, normalizePhone } from "@/lib/validation";

const UNAVAILABLE_MESSAGE =
  "Online account registration isn't connected yet. Please call (778) 278-7727 or visit our Langley storefront, and we'll get you set up.";

interface RegisterBody {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  salonName?: unknown;
  certification?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  agreedToTerms?: unknown;
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`register:${ip}`, 5, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const salonName = typeof body.salonName === "string" ? body.salonName.trim() : "";
  const certification = typeof body.certification === "string" ? body.certification.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const agreedToTerms = body.agreedToTerms === true;

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!email || !isValidEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!phone || !isValidCanadianPhone(phone)) fieldErrors.phone = "Enter a valid Canadian phone number.";
  if (!salonName) fieldErrors.salonName = "Salon/spa name is required.";
  if (!certification) fieldErrors.certification = "Certification is required.";
  if (!isValidPassword(password)) fieldErrors.password = "Password must be at least 8 characters and include a letter and a number.";
  if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (!agreedToTerms) fieldErrors.agreedToTerms = "You must agree to the Privacy Policy and Terms and Conditions.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const outcome = await registerCustomer({
    firstName,
    lastName,
    email: normalizedEmail,
    phone: normalizedPhone,
    salonName,
    certification,
    password,
  });

  if (outcome.ok) {
    // Registration succeeding does not log the customer in automatically —
    // account creation inside checkout, and what happens immediately after
    // registration, are both explicitly unconfirmed (see the Phase 2
    // report). The customer is sent to log in with their new credentials.
    return NextResponse.json({ ok: true });
  }

  if (outcome.reason === "duplicate_email") {
    // Deliberately still generic enough not to become an email-enumeration
    // oracle for LOGIN, but registration inherently has to tell the
    // customer their own email is already registered (WooCommerce itself
    // would reject it the same way) — this is expected, standard behavior,
    // distinct from the login endpoint's stricter non-disclosure rule.
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead.", fieldErrors: { email: "Email already registered." } },
      { status: 409 }
    );
  }

  console.warn(`[auth/register] attempted while unavailable — email=${normalizedEmail}`);
  return NextResponse.json({ error: UNAVAILABLE_MESSAGE, unavailable: true }, { status: 503 });
}
