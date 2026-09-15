import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// Content sourced verbatim from docs/Nags-Beauty-Website-Policies.pdf ("Return & Refund Policy" section).
const sections: PolicySection[] = [
  {
    heading: "1. 14-Day Return Policy",
    body: (
      <p>
        Products are eligible for return only when all of the following requirements are
        satisfied: the product is unopened; unused; remains in its original condition and
        packaging; is returned within 14 days of the original purchase date; and the original
        purchase receipt is provided. No exceptions will be made to these requirements, except
        where otherwise required by applicable law.
      </p>
    ),
  },
  {
    heading: "2. Sale and Discounted Items",
    body: (
      <p>
        ALL SALE AND DISCOUNTED ITEMS ARE FINAL SALE. Sale and discounted merchandise cannot be
        returned, exchanged, or refunded, except where otherwise required by applicable law.
      </p>
    ),
  },
  {
    heading: "3. Beauty and Personal-Care Products",
    body: (
      <p>
        For hygiene and safety reasons, opened or used beauty, cosmetic, personal-care, and
        similar products cannot be returned. Customers should inspect products carefully before
        opening or using them.
      </p>
    ),
  },
  {
    heading: "4. Proof of Purchase",
    body: (
      <p>
        The original receipt is required for all returns. Returns without the original receipt
        will not be accepted, except where otherwise required by applicable law.
      </p>
    ),
  },
  {
    heading: "5. Refunds",
    body: (
      <p>
        Eligible returns will be inspected to confirm compliance with this policy. Once approved,
        a refund will be processed using the applicable refund method available to us. Processing
        times may vary depending on the customer&rsquo;s financial institution, credit card
        issuer, or payment provider. Original shipping charges are not refundable unless otherwise
        required by applicable law or the return results from an error on our part.
      </p>
    ),
  },
  {
    heading: "6. Return Shipping",
    body: (
      <p>
        Unless an incorrect or damaged item was supplied or applicable law requires otherwise,
        customers are responsible for the costs associated with returning an online purchase.
        Please contact us before shipping a return so that appropriate return instructions can be
        provided.
      </p>
    ),
  },
  {
    heading: "7. Incorrect or Damaged Products",
    body: (
      <p>
        If you receive an incorrect product or a product that arrives damaged, please contact us
        promptly. Please retain the product, packaging, original receipt/order information and
        photographs, where applicable, so we can review the issue.
      </p>
    ),
  },
  {
    heading: "8. Training Courses",
    body: (
      <p>
        This Return &amp; Refund Policy applies to products and does not govern course deposits,
        training fees, cancellations, rescheduling, or no-shows. Please refer to our{" "}
        <Link href="/training-course-policy" className="text-gold-dark hover:underline">
          Training Course Registration, Cancellation &amp; Refund Policy
        </Link>
        .
      </p>
    ),
  },
];

export default function ReturnRefundPolicyPage() {
  return (
    <PolicyLayout
      title="Return & Refund Policy"
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
