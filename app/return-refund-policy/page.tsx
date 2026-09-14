import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  robots: { index: false, follow: false },
};

const LAST_UPDATED = "Last updated: September 2026 — Draft";

// DRAFT POLICY CONTENT — MUST BE REPLACED OR APPROVED BY THE CLIENT BEFORE PRODUCTION LAUNCH.
const sections: PolicySection[] = [
  {
    heading: "Return Eligibility",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Return Period",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Proof of Purchase",
    body: (
      <p>
        A valid proof of purchase, such as an order confirmation or receipt, is required for all
        returns and exchanges.
      </p>
    ),
  },
  {
    heading: "Product Condition",
    body: (
      <p>
        To be eligible for return, products must generally be unused, in their original packaging,
        and in the same condition in which they were received.
      </p>
    ),
  },
  {
    heading: "Hygiene-Sensitive and Opened Beauty Products",
    body: (
      <p>
        For health and hygiene reasons, certain beauty and esthetic supply products — including
        opened, used, or hygiene-sensitive items such as skincare, waxing, lash, and PMU
        consumables — may not be eligible for return once opened or used. Specific hygiene-related
        exclusions are [CLIENT TO CONFIRM].
      </p>
    ),
  },
  {
    heading: "Non-Returnable Products",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Sale and Clearance Products",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Damaged or Incorrect Products",
    body: (
      <p>
        If you receive a damaged, defective, or incorrect product, please contact us as soon as
        possible using the details below so we can arrange a resolution.
      </p>
    ),
  },
  {
    heading: "Return Authorization Process",
    body: (
      <p>
        To start a return, please contact us using the details below with your order information
        and reason for the return. Please do not send products back before receiving return
        instructions from us.
      </p>
    ),
  },
  {
    heading: "Return Shipping Costs",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Refund Processing Time",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Exchanges",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
  {
    heading: "Course Enrollment Cancellation and Refunds",
    body: <p>[CLIENT TO CONFIRM]</p>,
  },
];

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyLayout title="Return & Refund Policy" lastUpdated={LAST_UPDATED} sections={sections} />
  );
}
