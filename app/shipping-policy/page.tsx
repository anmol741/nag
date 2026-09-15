import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// Content sourced verbatim from docs/Nags-Beauty-Website-Policies.pdf ("Shipping Policy" section).
const sections: PolicySection[] = [
  {
    heading: "1. Shipping Area",
    body: (
      <p>
        We currently ship within Canada only. International shipping is not currently available
        through our website.
      </p>
    ),
  },
  {
    heading: "2. Order Processing",
    body: (
      <p>
        Orders are processed after payment has been successfully received or authorized.
        Processing times may vary depending on product availability, order volume, weekends,
        statutory holidays, and other circumstances.
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
    heading: "4. Delivery Times",
    body: (
      <p>
        Any delivery dates or timeframes provided are estimates only and are not guaranteed.
        Delivery may be affected by destination, carrier operations, weather, statutory holidays,
        peak periods, or other circumstances outside our reasonable control.
      </p>
    ),
  },
  {
    heading: "5. Shipping Address",
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
    heading: "6. Tracking",
    body: (
      <p>
        Where tracking is available, tracking information may be provided after your order has
        been shipped. Please allow sufficient time for the shipping carrier&rsquo;s tracking
        system to update.
      </p>
    ),
  },
  {
    heading: "7. Delayed or Missing Packages",
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
    heading: "8. Damaged Orders",
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
  return <PolicyLayout title="Shipping Policy" effectiveDate={EFFECTIVE_DATE} sections={sections} />;
}
