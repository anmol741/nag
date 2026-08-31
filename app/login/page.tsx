import type { Metadata } from "next";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export const metadata: Metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <ComingSoonPanel
      title="Account Login"
      description="Online accounts are launching alongside our new e-commerce platform. In the meantime, call or message us for wholesale account access."
    />
  );
}
