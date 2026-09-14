import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Shipping Policy",
  robots: { index: false, follow: false },
};

const LAST_UPDATED = "Last updated: September 2026 — Draft";

// DRAFT POLICY CONTENT — MUST BE REPLACED OR APPROVED BY THE CLIENT BEFORE PRODUCTION LAUNCH.
const sections: PolicySection[] = [
  {
    heading: "Available Delivery Regions",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Order-Processing Time",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Shipping Methods and Carriers",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Shipping Rates",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Free-Shipping Conditions",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Local Pickup",
    body: (
      <p>
        Local pickup may be available from our Langley, BC location at {business.address.full}.
        Availability, hours, and any conditions for local pickup are [CLIENT TO CONFIRM].
      </p>
    ),
  },
  {
    heading: "Tracking Information",
    body: (
      <p>
        Where a shipping method includes tracking, tracking information will be provided to the
        email or contact information on file for the order once it has shipped.
      </p>
    ),
  },
  {
    heading: "Incorrect Shipping Addresses",
    body: (
      <p>
        It is the customer&rsquo;s responsibility to provide an accurate and complete shipping
        address at checkout. We are not responsible for delays, additional charges, or lost
        shipments resulting from an incorrect or incomplete address supplied by the customer.
      </p>
    ),
  },
  {
    heading: "Delayed, Lost or Damaged Shipments",
    body: (
      <p>
        While we make reasonable efforts to ensure orders arrive on time and in good condition,
        delays, loss, or damage can occasionally occur once a package is in the carrier&rsquo;s
        possession. If your order arrives damaged or does not arrive, please contact us using the
        details below so we can assist you.
      </p>
    ),
  },
  {
    heading: "International Shipping",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Duties and Taxes",
    body: (
      <p>
        Any applicable duties, customs fees, or taxes on shipments outside of Canada are the
        responsibility of the customer, unless otherwise stated at checkout.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return <PolicyLayout title="Shipping Policy" lastUpdated={LAST_UPDATED} sections={sections} />;
}
