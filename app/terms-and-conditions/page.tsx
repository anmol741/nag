import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// Content sourced verbatim from docs/Nags-Beauty-Website-Policies.pdf ("Terms & Conditions" section).
const sections: PolicySection[] = [
  {
    heading: "Introduction",
    body: (
      <p>
        These Terms &amp; Conditions apply to your use of www.nagsbeautysupply.com and to
        purchases, registrations, and other transactions made with Nag&rsquo;s Beauty Supplies
        &amp; Training Centre. By using our website, purchasing products, or registering for
        training, you agree to the applicable terms set out below.
      </p>
    ),
  },
  {
    heading: "1. Products and Services",
    body: (
      <p>
        Nag&rsquo;s Beauty sells beauty supplies and provides beauty-related education and
        training. We make reasonable efforts to provide accurate descriptions, photographs,
        pricing, availability, and other information. Product colours, packaging, labelling, or
        appearance may differ from images displayed online, including due to screen settings or
        manufacturer changes. We reserve the right to correct errors or inaccuracies and update
        website information where necessary.
      </p>
    ),
  },
  {
    heading: "2. Pricing and Payment",
    body: (
      <p>
        Unless otherwise indicated, prices are stated in Canadian dollars. Applicable taxes,
        shipping charges, and other applicable charges will be shown or calculated during
        checkout. Prices, products, promotions, and availability may change without notice.
        Customers are responsible for providing complete and accurate payment and billing
        information.
      </p>
    ),
  },
  {
    heading: "3. Orders",
    body: (
      <p>
        Submitting an order does not necessarily constitute acceptance of the order. We reserve
        the right to refuse or cancel an order where reasonably necessary, including due to
        product availability, incorrect pricing or product information, payment issues, suspected
        fraud, or other legitimate business reasons. If we cancel an order after payment has been
        successfully processed, the applicable amount will be refunded.
      </p>
    ),
  },
  {
    heading: "4. Shipping",
    body: (
      <p>
        Nag&rsquo;s Beauty currently ships within Canada only. Shipping charges and available
        delivery options, where applicable, will be presented during checkout. Delivery dates are
        estimates and may be affected by circumstances outside our reasonable control. Please
        review our separate{" "}
        <Link href="/shipping-policy" className="text-gold-dark hover:underline">
          Shipping Policy
        </Link>{" "}
        for complete details.
      </p>
    ),
  },
  {
    heading: (
      <Link href="/return-refund-policy" className="text-gold-dark hover:underline">
        5. Product Returns
      </Link>
    ),
    body: (
      <p>
        Eligible products must be unopened, unused, in their original condition and packaging,
        returned within 14 days of purchase, and accompanied by the original receipt. No
        exceptions will be made to these requirements, except where otherwise required by
        applicable law. All sale and discounted items are final sale.
      </p>
    ),
  },
  {
    heading: "6. Training Programs",
    body: (
      <p>
        Training courses, workshops, and classes are subject to availability, applicable
        prerequisites, payment requirements, and the terms communicated at registration. Course
        deposits are non-refundable, except where otherwise required by applicable law. Students
        must comply with our Training Course Registration, Cancellation &amp; Refund Policy.
      </p>
    ),
  },
  {
    heading: "7. Intellectual Property",
    body: (
      <p>
        Unless otherwise indicated, original website content, branding, graphics, photographs,
        educational content, course materials, manuals, and other materials belong to
        Nag&rsquo;s Beauty or are used with permission. They may not be reproduced, distributed,
        sold, published, or commercially exploited without authorization except as permitted by
        law.
      </p>
    ),
  },
  {
    heading: "8. Appropriate Website Use",
    body: (
      <p>
        Users must not misuse our website, interfere with its operation, attempt unauthorized
        access, introduce malicious software, engage in fraudulent activities, or use our website
        for unlawful purposes.
      </p>
    ),
  },
  {
    heading: "9. Limitation of Liability",
    body: (
      <p>
        To the extent permitted by applicable law, Nag&rsquo;s Beauty will not be responsible for
        indirect, incidental, special, or consequential losses arising from the use of our
        website, products, or services. Nothing in these Terms is intended to exclude or restrict
        rights or remedies that cannot lawfully be excluded or restricted.
      </p>
    ),
  },
  {
    heading: "10. Governing Law",
    body: (
      <p>
        These Terms &amp; Conditions are governed by the applicable laws of the Province of
        British Columbia and the federal laws of Canada applicable therein.
      </p>
    ),
  },
  {
    heading: "11. Changes to These Terms",
    body: (
      <p>
        We may revise these Terms &amp; Conditions periodically. Updated terms will be posted on
        our website with the applicable effective date.
      </p>
    ),
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" effectiveDate={EFFECTIVE_DATE} sections={sections} />
  );
}
