import type { Metadata } from "next";
import PolicyPending from "@/components/PolicyPending";

// No Shipping Policy page exists on the live WordPress site (verified via
// the WordPress REST API page listing) and none was found in the supplied
// project content, so no policy text is migrated here.
export const metadata: Metadata = {
  title: "Shipping Policy",
  robots: { index: false, follow: false },
};

export default function ShippingPolicyPage() {
  return <PolicyPending title="Shipping Policy" />;
}
