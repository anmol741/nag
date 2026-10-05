import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCanadianAddress,
  parseCheckoutLines,
  parseCouponCode,
  parseCustomerNote,
  parseDollarsToCents,
  parseIdempotencyKey,
  parseQuoteDestination,
  parseShippingMethodId,
} from "../lib/checkout/validation";

const address = {
  firstName: "Jane",
  lastName: "Doe",
  addressLine1: "102-19623 56 Avenue",
  city: "Langley",
  province: "bc",
  postalCode: "v3a3x7",
  phone: "778.278.7727",
};

test("valid Canadian address is normalized", () => {
  const errors: Record<string, string> = {};
  const parsed = parseCanadianAddress(address, "billing", errors, { phoneRequired: true });
  assert.deepEqual(errors, {});
  assert.equal(parsed?.province, "BC");
  assert.equal(parsed?.postalCode, "V3A 3X7");
  assert.equal(parsed?.phone, "(778) 278-7727");
  assert.equal(parsed?.country, "CA");
});

test("non-Canadian addresses are blocked", () => {
  const errors: Record<string, string> = {};
  assert.equal(parseCanadianAddress({ ...address, country: "US", province: "WA", postalCode: "98101" }, "shipping", errors), null);
  assert.equal(errors.shippingCountry, "We currently ship within Canada only.");
  assert.ok(errors.shippingProvince);
  assert.ok(errors.shippingPostalCode);
});

test("missing phone is an error only when required", () => {
  const e1: Record<string, string> = {};
  parseCanadianAddress({ ...address, phone: "" }, "billing", e1, { phoneRequired: true });
  assert.ok(e1.billingPhone);
  const e2: Record<string, string> = {};
  assert.ok(parseCanadianAddress({ ...address, phone: "" }, "shipping", e2));
});

test("cart lines: IDs and quantities only, duplicates merged", () => {
  const result = parseCheckoutLines([
    { productId: "12", quantity: 2, price: 0.01 },
    { productId: "12", quantity: 3 },
    { productId: "40", variationId: "41", quantity: 1 },
  ]);
  assert.ok(result.ok);
  if (result.ok) {
    assert.deepEqual(result.lines, [
      { productId: "12", variationId: undefined, quantity: 5 },
      { productId: "40", variationId: "41", quantity: 1 },
    ]);
    // Client-sent price is never carried through.
    assert.equal("price" in result.lines[0], false);
  }
});

test("cart lines: invalid quantities and IDs are rejected", () => {
  assert.equal(parseCheckoutLines([]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: 0 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: -1 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: 1.5 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: 1000 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: "2" }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "abc", quantity: 1 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1 OR 1=1", quantity: 1 }]).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", variationId: "x", quantity: 1 }]).ok, false);
  assert.equal(parseCheckoutLines(Array.from({ length: 51 }, (_, i) => ({ productId: String(i + 1), quantity: 1 }))).ok, false);
  assert.equal(parseCheckoutLines([{ productId: "1", quantity: 600 }, { productId: "1", quantity: 600 }]).ok, false);
});

test("coupon codes", () => {
  assert.deepEqual(parseCouponCode(" SAVE10 "), { ok: true, code: "save10" });
  assert.deepEqual(parseCouponCode(""), { ok: true, code: "" });
  assert.equal(parseCouponCode("<script>").ok, false);
  assert.equal(parseCouponCode("x".repeat(51)).ok, false);
});

test("shipping method IDs and idempotency keys", () => {
  assert.equal(parseShippingMethodId("flat_rate:3"), "flat_rate:3");
  assert.equal(parseShippingMethodId("nag_local_pickup"), "nag_local_pickup");
  assert.equal(parseShippingMethodId("flat rate; drop"), null);
  assert.equal(parseIdempotencyKey("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), "3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  assert.equal(parseIdempotencyKey("not-a-uuid"), null);
});

test("quote destination: incomplete is allowed (null), foreign is refused", () => {
  assert.deepEqual(parseQuoteDestination({ province: "BC", postalCode: "v3a 3x7", city: "Langley" }), {
    ok: true,
    destination: { province: "BC", postalCode: "V3A 3X7", city: "Langley", country: "CA" },
  });
  assert.deepEqual(parseQuoteDestination({ province: "", postalCode: "" }), { ok: true, destination: null });
  assert.equal(parseQuoteDestination({ country: "US", province: "WA", postalCode: "98101" }).ok, false);
});

test("customer notes are trimmed, capped and stripped of control characters", () => {
  assert.equal(parseCustomerNote("  hello\u0000 world \n line2 "), "hello world \n line2");
  assert.equal(parseCustomerNote("x".repeat(2000)).length, 1000);
  assert.equal(parseCustomerNote(42), "");
});

test("course prices parse from the site's own display strings", () => {
  assert.equal(parseDollarsToCents("$1,499.00"), 149900);
  assert.equal(parseDollarsToCents("$1,000"), 100000);
  assert.equal(parseDollarsToCents("$995.00"), 99500);
  assert.equal(parseDollarsToCents("$0"), null);
  assert.equal(parseDollarsToCents("Contact us"), null);
});
