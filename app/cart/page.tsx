import type { Metadata } from "next";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <ComingSoonPanel
      title="Your Cart"
      description="Online checkout is on its way. To order wholesale supplies right now, give us a call or visit the Langley storefront."
    />
  );
}
