import type { Metadata } from "next";
import { business } from "@/lib/site-config";
import NotFoundPage from "@/components/NotFoundPage";

// The root layout's title template (`%s | Nag's Beauty Supplies`) isn't
// reliably applied when notFound() is triggered from inside a nested
// dynamic route (verified: the browser title fell back to the homepage
// title for /products/[slug] and /shop/category/[slug]). Setting an
// `absolute` title sidesteps the template entirely, so it's correct
// regardless of which not-found boundary Next.js resolves to.
export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${business.shortName}` },
};

export default function NotFound() {
  return <NotFoundPage />;
}
