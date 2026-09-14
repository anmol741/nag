import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  robots: { index: false, follow: false },
};

const LAST_UPDATED = "Last updated: September 2026 — Draft";

// DRAFT POLICY CONTENT — MUST BE REPLACED OR APPROVED BY THE CLIENT BEFORE PRODUCTION LAUNCH.
const sections: PolicySection[] = [
  {
    heading: "Acceptance of Terms",
    body: (
      <p>
        By accessing or using the {business.name} website, placing a wholesale order, or
        enrolling in a training course, you agree to be bound by these Terms and Conditions. If
        you do not agree to these terms, please do not use our website or services.
      </p>
    ),
  },
  {
    heading: "Website Eligibility",
    body: (
      <p>
        Our website and wholesale pricing are intended for licensed and aspiring beauty
        professionals, students, and businesses. By using our website, you confirm that you are
        legally able to enter into a binding agreement.
      </p>
    ),
  },
  {
    heading: "Customer Accounts",
    body: (
      <p>
        If you create an account with us, you are responsible for maintaining the confidentiality
        of your account details and for all activity that occurs under your account. Please
        notify us if you believe your account has been used without your permission.
      </p>
    ),
  },
  {
    heading: "Product Information and Availability",
    body: (
      <p>
        We make reasonable efforts to display accurate product descriptions, images, and
        availability. However, we do not guarantee that all product information is complete,
        current, or error-free, and product availability may change without notice.
      </p>
    ),
  },
  {
    heading: "Pricing and Taxes",
    body: (
      <p>
        Product and course prices are listed in Canadian dollars unless otherwise stated and are
        subject to change without notice. Applicable taxes are added at checkout in accordance
        with applicable law.
      </p>
    ),
  },
  {
    heading: "Orders and Order Acceptance",
    body: (
      <p>
        Placing an order through our website is an offer to purchase. We reserve the right to
        accept, decline, or cancel any order, including in cases of pricing errors, suspected
        fraud, or product unavailability.
      </p>
    ),
  },
  {
    heading: "Wholesale Purchasing",
    body: (
      <p>
        Some products and pricing on our website are offered on a wholesale basis to qualifying
        professional and business customers. Wholesale account eligibility, terms, and minimums
        are [CLIENT TO CONFIRM].
      </p>
    ),
  },
  {
    heading: "Course Information and Enrollment",
    body: (
      <p>
        Course descriptions, schedules, and pricing are provided for informational purposes and
        may change. Enrollment in a course is confirmed upon our acceptance of your registration
        and, where applicable, receipt of payment.
      </p>
    ),
  },
  {
    heading: "Payments",
    body: (
      <p>
        Payment for products and courses is due at the time of order or enrollment unless
        otherwise agreed in writing. Payments are processed through our third-party payment
        provider. [CLIENT TO CONFIRM].
      </p>
    ),
  },
  {
    heading: "Shipping",
    body: (
      <p>
        Shipping methods, rates, and delivery regions are described in our{" "}
        <a href="/shipping-policy" className="text-gold-dark hover:underline">
          Shipping Policy
        </a>
        . Shipping details are [CLIENT TO CONFIRM].
      </p>
    ),
  },
  {
    heading: "Returns and Refunds",
    body: (
      <p>
        Returns and refunds for products, and cancellation terms for courses, are described in
        our{" "}
        <a href="/return-refund-policy" className="text-gold-dark hover:underline">
          Return &amp; Refund Policy
        </a>
        .
      </p>
    ),
  },
  {
    heading: "Intellectual Property",
    body: (
      <p>
        All website content, including text, graphics, logos, images, and course materials, is
        the property of {business.name} or its licensors and is protected by applicable
        intellectual property laws. You may not reproduce, distribute, or use this content without
        our prior written permission.
      </p>
    ),
  },
  {
    heading: "Prohibited Use",
    body: (
      <p>
        You agree not to use our website for any unlawful purpose, to attempt to gain
        unauthorized access to our systems, to interfere with the operation of our website, or to
        misuse any content, pricing, or course materials made available to you.
      </p>
    ),
  },
  {
    heading: "Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, {business.name} is not liable for any indirect,
        incidental, or consequential damages arising from your use of our website, products, or
        courses. Our total liability for any claim will not exceed the amount you paid for the
        applicable product or course.
      </p>
    ),
  },
  {
    heading: "Governing Law",
    body: (
      <p>
        These Terms and Conditions are governed by the laws of the Province of British Columbia
        and the applicable laws of Canada, without regard to conflict-of-law principles.
      </p>
    ),
  },
  {
    heading: "Changes to the Terms",
    body: (
      <p>
        We may update these Terms and Conditions from time to time. Changes will be posted on this
        page with an updated &ldquo;last updated&rdquo; date. Continued use of our website after
        changes are posted constitutes acceptance of the revised terms.
      </p>
    ),
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout title="Terms and Conditions" lastUpdated={LAST_UPDATED} sections={sections} />
  );
}
