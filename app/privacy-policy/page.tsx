import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";
import { business } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

const LAST_UPDATED = "Last updated: September 2026 — Draft";

// DRAFT POLICY CONTENT — MUST BE REPLACED OR APPROVED BY THE CLIENT BEFORE PRODUCTION LAUNCH.
const sections: PolicySection[] = [
  {
    heading: "Information Customers Provide",
    body: (
      <p>
        When you interact with {business.name} — whether by placing a wholesale order, enrolling
        in a training course, signing up for our newsletter, or contacting us directly — we may
        collect information you choose to provide, such as your name, phone number, mailing or
        shipping address, and any details you include in a form or message to us.
      </p>
    ),
  },
  {
    heading: "Account and Order Information",
    body: (
      <p>
        If you create an account or place an order through our online shop, we collect
        information needed to process that order and manage your account, including your contact
        details, billing and shipping addresses, and a record of the products or courses you have
        purchased or enrolled in.
      </p>
    ),
  },
  {
    heading: "Contact, Newsletter and Enrollment Forms",
    body: (
      <p>
        Our contact form, newsletter sign-up, and course enrollment forms collect the information
        you enter into those forms — such as your name, phone number, and the details of your
        inquiry, subscription, or enrollment request — so that we can respond to you or process
        your request.
      </p>
    ),
  },
  {
    heading: "Cookies and Analytics",
    body: (
      <p>
        Our website may use cookies and similar technologies to keep the site working properly,
        remember your preferences, and understand how visitors use our website through analytics
        tools. You can usually adjust your browser settings to refuse or delete cookies, though
        some parts of the site may not function as intended if you do.
      </p>
    ),
  },
  {
    heading: "How Information Is Used",
    body: (
      <p>
        We use the information we collect to process and fulfill wholesale orders, manage course
        enrollments, respond to inquiries, send newsletter and course-update communications to
        subscribers, operate and improve our website, and meet our legal and accounting
        obligations.
      </p>
    ),
  },
  {
    heading: "WooCommerce and Service Providers",
    body: (
      <p>
        Our online shop is powered by WooCommerce and related third-party services that help us
        operate our website, process orders, and manage customer communications. These service
        providers may process customer information on our behalf, solely for the purpose of
        providing those services to us.
      </p>
    ),
  },
  {
    heading: "Payment Information",
    body: (
      <p>
        Payments made through our website are processed by a third-party payment provider.
        [CLIENT TO CONFIRM]. We do not store full payment card details on our own servers; payment
        information is handled directly by our payment processor in accordance with its own
        privacy and security practices.
      </p>
    ),
  },
  {
    heading: "Information Sharing",
    body: (
      <p>
        We do not sell customer information. We may share information with trusted service
        providers who help us operate our website, process payments, fulfill orders, or deliver
        course-related communications, and we may disclose information where required to comply
        with the law or to protect our rights, customers, or business.
      </p>
    ),
  },
  {
    heading: "Data Retention",
    body: (
      <p>
        We retain customer and order information for as long as necessary to fulfill the purposes
        described in this policy, including maintaining order and enrollment records, and to meet
        our legal, accounting, and reporting obligations.
      </p>
    ),
  },
  {
    heading: "Customer Privacy Rights",
    body: (
      <p>
        You may request access to, correction of, or deletion of the personal information we hold
        about you, subject to applicable law and our legitimate business and record-keeping needs.
        To make a request, please use the contact details below.
      </p>
    ),
  },
  {
    heading: "Data Security",
    body: (
      <p>
        We take reasonable measures intended to protect customer information from unauthorized
        access, use, or disclosure. However, no method of transmission or storage over the
        internet is completely secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    heading: "Children's Privacy",
    body: (
      <p>
        Our website and services are intended for adults and professional or aspiring
        estheticians. We do not knowingly collect personal information from children, and our
        courses and wholesale products are not directed at children.
      </p>
    ),
  },
  {
    heading: "Policy Changes",
    body: (
      <p>
        We may update this privacy policy from time to time. Any changes will be posted on this
        page with an updated &ldquo;last updated&rdquo; date. We encourage customers to review this
        page periodically.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return <PolicyLayout title="Privacy Policy" lastUpdated={LAST_UPDATED} sections={sections} />;
}
