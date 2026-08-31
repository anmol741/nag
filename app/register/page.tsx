import type { Metadata } from "next";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <ComingSoonPanel
      title="Create an Account"
      description="Account registration is launching alongside our new e-commerce platform. Reach out to set up a wholesale account today."
    />
  );
}
