import type { Metadata } from "next";
import ComingSoonPanel from "@/components/ComingSoonPanel";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <ComingSoonPanel
      title="Your Wishlist"
      description="Save your favorite products once our online shop launches. For now, browse categories and contact us to place an order."
    />
  );
}
