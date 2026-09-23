import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// The confirmed pickup/contact address for this page only — the Contact
// block on the other four policy pages keeps policyContact.address
// unchanged (see PolicyLayout's contactAddress prop).
const PICKUP_ADDRESS = "Unit 102, 19623 56 Avenue, Langley, BC V3A 3X7, Canada";

// Content sourced from docs/Nags-Beauty-Website-Policies.pdf ("Shipping
// Policy" section), updated with the client's confirmed shipping details
// (Canada-only scope, 3–5 business day processing, and local pickup hours
// and address). No shipping rate or carrier is named — neither has been
// confirmed yet — and this page's own address here is the confirmed pickup
// location only; the shared `policyContact` block below (used by all five
// policy pages) is untouched, so this doesn't affect Privacy, Terms, Return
// & Refund, or the Training Course Policy.
const sections: PolicySection[] = [
  {
    heading: "1. Shipping Area",
    body: (
      <p>
        Shipping is available within Canada only. International and USA shipping are not
        available.
      </p>
    ),
  },
  {
    heading: "2. Order Processing",
    body: (
      <p>
        Orders are processed after payment has been successfully received or authorized. Normal
        processing time is 3–5 business days, though this may vary depending on product
        availability, order volume, weekends, statutory holidays, and other circumstances.
      </p>
    ),
  },
  {
    heading: "3. Shipping Charges",
    body: (
      <p>
        Applicable shipping charges will be displayed or calculated during checkout before you
        complete your purchase.
      </p>
    ),
  },
  {
    heading: "4. Local Pickup",
    body: (
      <>
        <p>Local pickup is available at our Langley storefront during pickup hours:</p>
        <p>Monday–Friday, 10:00 AM–4:30 PM</p>
        <p>
          Unit 102
          <br />
          19623 56 Avenue
          <br />
          Langley, BC V3A 3X7
          <br />
          Canada
        </p>
      </>
    ),
  },
  {
    heading: "5. Delivery Times",
    body: (
      <p>
        Any delivery dates or timeframes provided are estimates only and are not guaranteed.
        Delivery may be affected by destination, carrier operations, weather, statutory holidays,
        peak periods, or other circumstances outside our reasonable control.
      </p>
    ),
  },
  {
    heading: "6. Shipping Address",
    body: (
      <p>
        Customers are responsible for providing a complete and accurate shipping address. Please
        carefully review your shipping information before submitting your order. If you notice an
        error after placing an order, contact us immediately. We cannot guarantee that an address
        can be changed once an order has been processed or shipped. Where permitted by law,
        additional costs resulting from an incorrect or incomplete address may be the
        customer&rsquo;s responsibility.
      </p>
    ),
  },
  {
    heading: "7. Tracking",
    body: (
      <p>
        Where tracking is available, tracking information may be provided after your order has
        been shipped. Please allow sufficient time for the shipping carrier&rsquo;s tracking
        system to update.
      </p>
    ),
  },
  {
    heading: "8. Delayed or Missing Packages",
    body: (
      <p>
        After an order has been transferred to the shipping carrier, circumstances outside our
        direct control may affect delivery. If a shipment is significantly delayed or appears to
        be missing, please contact us. We will assist with reviewing the shipment and, where
        appropriate, contacting the carrier.
      </p>
    ),
  },
  {
    heading: "9. Damaged Orders",
    body: (
      <p>
        If your order arrives damaged, please contact us promptly. Please retain the product,
        packaging, receipt/order information and, where possible, photographs of the damaged
        product and shipping packaging. We will review the circumstances and advise you of the
        appropriate next steps.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
      contactAddress={PICKUP_ADDRESS}
    />
  );
}
