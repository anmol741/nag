import type { Metadata } from "next";
import PolicyLayout, { type PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Training Course Registration, Cancellation & Refund Policy",
  robots: { index: false, follow: false },
};

const EFFECTIVE_DATE = "September 2026";

// Content sourced verbatim from docs/Nags-Beauty-Website-Policies.pdf
// ("Training Course Registration, Cancellation & Refund Policy" section).
const sections: PolicySection[] = [
  {
    heading: "Introduction",
    body: (
      <p>
        This policy applies to courses, classes, workshops, and other training programs provided
        by Nag&rsquo;s Beauty Supplies &amp; Training Centre. By registering for training,
        students agree to the applicable terms below.
      </p>
    ),
  },
  {
    heading: "1. Age Requirements",
    body: (
      <p>
        Students 19 years of age or older may register for training on their own behalf. Students
        under 19 years of age require the approval of a parent or legal guardian. Nag&rsquo;s
        Beauty may require the parent or legal guardian to complete or sign registration, consent,
        waiver, or other required documentation. Certain courses may have additional minimum-age,
        prerequisite, health, safety, or certification requirements.
      </p>
    ),
  },
  {
    heading: "2. Registration and Deposits",
    body: (
      <p>
        A deposit may be required to reserve a student&rsquo;s seat. ALL COURSE DEPOSITS ARE
        NON-REFUNDABLE, except where a refund or cancellation right is required by applicable law.
        Registration is not considered confirmed until the required deposit or payment has been
        received and the student&rsquo;s registration has been accepted.
      </p>
    ),
  },
  {
    heading: "3. Outstanding Course Balance",
    body: (
      <p>
        Any outstanding balance must be paid by the deadline communicated during registration.
        Failure to make payment by the required deadline may result in cancellation of the
        registration and forfeiture of the deposit, subject to applicable law.
      </p>
    ),
  },
  {
    heading: "4. Student Cancellations",
    body: (
      <p>
        Students who cannot attend a scheduled course should notify Nag&rsquo;s Beauty as soon as
        possible. Course deposits remain non-refundable when a student cancels, except where
        otherwise required by applicable law.
      </p>
    ),
  },
  {
    heading: "5. Rescheduling",
    body: (
      <>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>7 or more days before the scheduled course:</strong> The student may request
            one transfer to another available course date without a rescheduling fee. The original
            deposit remains non-refundable.
          </li>
          <li>
            <strong>3&ndash;6 days before the scheduled course:</strong> A transfer to another
            available course date may be permitted, subject to a $50 rescheduling fee. The original
            deposit remains non-refundable.
          </li>
          <li>
            <strong>Less than 72 hours before the scheduled course:</strong> The registration is
            not eligible for transfer, rescheduling, credit, or refund, except where otherwise
            required by applicable law.
          </li>
        </ul>
        <p>A registration may normally be transferred/rescheduled only once.</p>
      </>
    ),
  },
  {
    heading: "6. No-Shows",
    body: (
      <p>
        A student who fails to attend their scheduled course without providing the required
        advance notice will be considered a no-show. NO-SHOWS ARE NON-REFUNDABLE. Except where
        otherwise required by applicable law, a no-show will not receive a refund, credit,
        transfer, or rescheduling, and amounts paid for the missed course may be forfeited. A
        student wishing to attend on another date will be required to register and pay for a new
        course.
      </p>
    ),
  },
  {
    heading: "7. Late Arrivals",
    body: (
      <p>
        Students must arrive on time and be prepared to participate for the full duration of the
        course. Significant lateness may prevent participation where missed instruction could
        affect safety, practical training, assessment, or successful course completion. Where
        participation cannot reasonably continue due to significant lateness, the applicable
        late-cancellation/no-show provisions may apply, subject to applicable law.
      </p>
    ),
  },
  {
    heading: "8. Cancellation or Rescheduling by Nag’s Beauty",
    body: (
      <p>
        Nag&rsquo;s Beauty may occasionally need to cancel or reschedule training due to instructor
        availability, insufficient enrollment, emergencies, severe weather, or circumstances
        outside our reasonable control. Affected students will be contacted using the information
        supplied during registration. If Nag&rsquo;s Beauty cancels a course, affected students
        will be offered an appropriate alternative date or other remedy in accordance with
        applicable law.
      </p>
    ),
  },
  {
    heading: "9. Course Kits, Products and Materials",
    body: (
      <p>
        Certain training programs may include or require professional products, tools, kits,
        manuals, or other materials. Once course kits, products, or materials have been issued,
        opened, used, personalized, or otherwise made non-resalable, they may not be eligible for
        return or refund, subject to applicable law. Students are responsible for bringing any
        products, equipment, tools, or other items identified as required for their course.
      </p>
    ),
  },
  {
    heading: "10. Models",
    body: (
      <p>
        Some practical courses may require students to provide a suitable model. Where a student
        is responsible for providing a model, the model must satisfy any requirements communicated
        before the course. Failure to provide a required model may prevent the student from
        completing the practical component of the training. Nag&rsquo;s Beauty cannot guarantee an
        alternative model will be available.
      </p>
    ),
  },
  {
    heading: "11. Attendance and Certificates",
    body: (
      <p>
        Students must satisfy applicable attendance, practical work, assessment, and other
        completion requirements before receiving a certificate of completion. Payment for or
        attendance at a course does not automatically guarantee successful completion or issuance
        of a certificate.
      </p>
    ),
  },
  {
    heading: "12. Professional Requirements",
    body: (
      <p>
        Training provided by Nag&rsquo;s Beauty is educational in nature. Completion of a course
        does not guarantee employment, clientele, income, business success, professional
        licensing, or certification by an outside organization unless expressly stated for a
        particular program. Students are responsible for determining whether additional licences,
        certifications, insurance, permits, or regulatory requirements apply before providing
        services professionally.
      </p>
    ),
  },
  {
    heading: "13. Student Conduct and Safety",
    body: (
      <p>
        Students are expected to behave professionally and respectfully toward instructors, staff,
        clients, models, and other students. Students must follow all hygiene, sanitation,
        product-use, equipment, and safety instructions provided during training. Nag&rsquo;s
        Beauty reserves the right to remove a student from a class for unsafe, threatening,
        abusive, discriminatory, seriously disruptive, or otherwise inappropriate conduct.
      </p>
    ),
  },
  {
    heading: "14. Photography and Video",
    body: (
      <p>
        Photographs or videos may occasionally be taken during training for educational,
        promotional, website, or social-media purposes. Where required, appropriate consent will
        be obtained before identifiable photographs or videos of students or models are used.
      </p>
    ),
  },
  {
    heading: "15. Acceptance of Policy",
    body: (
      <p>
        By registering for training, the student&mdash;and, where applicable, their parent or
        legal guardian&mdash;acknowledges that they have reviewed and accepted the applicable
        registration, cancellation, rescheduling, no-show, and refund terms, subject to rights
        provided by applicable law.
      </p>
    ),
  },
];

export default function TrainingCoursePolicyPage() {
  return (
    <PolicyLayout
      title="Training Course Registration, Cancellation & Refund Policy"
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
    />
  );
}
