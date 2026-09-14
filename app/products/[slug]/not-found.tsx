import type { Metadata } from "next";
import { business } from "@/lib/site-config";
import NotFoundPage from "@/components/NotFoundPage";

// Local to this segment so the title is set correctly when notFound() is
// called from app/products/[slug]/page.tsx — see app/not-found.tsx for why
// relying on the root boundary's metadata isn't enough here.
export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${business.shortName}` },
};

export default function ProductNotFound() {
  return <NotFoundPage />;
}
