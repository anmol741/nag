import type { Metadata } from "next";
import PolicyPending from "@/components/PolicyPending";

// No Return/Refund Policy page exists on the live WordPress site (verified
// via the WordPress REST API page listing) and none was found in the
// supplied project content, so no policy text is migrated here.
export const metadata: Metadata = {
  title: "Return & Refund Policy",
  robots: { index: false, follow: false },
};

export default function ReturnRefundPolicyPage() {
  return <PolicyPending title="Return & Refund Policy" />;
}
