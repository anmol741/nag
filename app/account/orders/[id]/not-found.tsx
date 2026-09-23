import type { Metadata } from "next";
import { business } from "@/lib/site-config";
import NotFoundPage from "@/components/NotFoundPage";

export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${business.shortName}` },
};

export default function OrderNotFound() {
  return <NotFoundPage />;
}
