import type { Metadata } from "next";
import PolicyPending from "@/components/PolicyPending";

// The only "Privacy Policy" content found on the live WordPress site
// (https://nagsbeautysupply.com/?page_id=1629) is the unedited default
// WordPress/theme sample text — it literally reads "Thank you for visiting
// XTemos Studio" (the Woodmart theme vendor) and was never customized for
// this business. Publishing that as Nag's Beauty's real privacy policy
// would be a false business claim, so it is treated as unverified content,
// same as the other policy pages, rather than migrated.
export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPending
      title="Privacy Policy"
      note="The privacy policy text found on the live WordPress site is unedited theme sample content, not verified content specific to this business, so it was not migrated."
    />
  );
}
