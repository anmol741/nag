import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// Content sourced verbatim from docs/Nags-Beauty-Website-Policies.pdf ("Privacy Policy" section).
const sections: PolicySection[] = [
  {
    heading: "Introduction",
    body: (
      <p>
        Nag&rsquo;s Beauty Supplies &amp; Training Centre (&ldquo;Nag&rsquo;s Beauty,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is
        committed to protecting the personal information entrusted to us. This Privacy Policy
        explains how we collect, use, disclose, store, and protect personal information when you
        visit our website, purchase products, register for training, contact us, or otherwise
        interact with our business.
      </p>
    ),
  },
  {
    heading: "1. Information We Collect",
    body: (
      <>
        <p>Depending on how you interact with us, we may collect information such as:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name</li>
          <li>Email address</li>
          <li>Telephone number</li>
          <li>Billing and shipping address</li>
          <li>Order and purchase information</li>
          <li>Training and course registration information</li>
          <li>Customer service communications</li>
          <li>Information voluntarily provided through forms or inquiries</li>
        </ul>
        <p>
          When you make an online payment, your payment information may be processed by
          third-party payment service providers. We do not intend to retain complete credit or
          debit card details on our own systems where payment is processed by such providers.
        </p>
        <p>
          Our website may also automatically collect certain technical information, such as IP
          address, browser type, device information, pages visited, and website activity through
          cookies and similar technologies.
        </p>
      </>
    ),
  },
  {
    heading: "2. How We Use Personal Information",
    body: (
      <>
        <p>We may use personal information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process and fulfill purchases</li>
          <li>Process payments and refunds</li>
          <li>Arrange shipping and delivery</li>
          <li>Manage course and training registrations</li>
          <li>Communicate regarding orders, courses, appointments, or inquiries</li>
          <li>Provide customer service</li>
          <li>Maintain appropriate business and transaction records</li>
          <li>Prevent fraud or unauthorized transactions</li>
          <li>Improve our website, products, services, and training programs</li>
          <li>Send promotional communications where permitted by law</li>
          <li>Meet applicable legal and regulatory obligations</li>
        </ul>
      </>
    ),
  },
  {
    heading: "3. Sharing Personal Information",
    body: (
      <p>
        Nag&rsquo;s Beauty does not sell or rent customers&rsquo; personal information. We may
        disclose information to trusted service providers where reasonably necessary to operate
        our business, including payment processors, website/e-commerce providers, shipping
        companies, IT providers, and other service providers. We may also disclose personal
        information when required or permitted by applicable law.
      </p>
    ),
  },
  {
    heading: "4. Cookies and Website Technologies",
    body: (
      <p>
        Our website may use cookies and similar technologies to operate website features,
        remember preferences, understand website activity, and improve the customer experience.
        You may be able to control or disable cookies through your browser settings. Certain
        website functions may not work properly if cookies are disabled.
      </p>
    ),
  },
  {
    heading: "5. Marketing Communications",
    body: (
      <p>
        Where permitted by applicable law, we may communicate with customers about new products,
        promotions, training programs, events, or other offers. Recipients may unsubscribe from
        promotional emails using the unsubscribe option provided in the communication or by
        contacting us.
      </p>
    ),
  },
  {
    heading: "6. Protection and Retention of Information",
    body: (
      <p>
        We use reasonable administrative, technical, and physical safeguards appropriate to the
        nature of the information to protect personal information from unauthorized access, loss,
        misuse, disclosure, alteration, or destruction. No method of electronic transmission or
        storage can be guaranteed to be completely secure. Personal information is retained only
        for as long as reasonably necessary for the purposes for which it was collected and to
        satisfy applicable legal, accounting, business, and regulatory requirements.
      </p>
    ),
  },
  {
    heading: "7. Access and Correction",
    body: (
      <p>
        Subject to applicable law, individuals may contact us to request access to personal
        information we hold about them or to request correction of inaccurate information.
      </p>
    ),
  },
  {
    heading: "8. Changes to This Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy periodically. Any revised version will be posted on our
        website with an updated effective date.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return <PolicyLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE} sections={sections} />;
}
