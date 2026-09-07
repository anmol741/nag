import type { Metadata } from "next";
import ComparePageClient from "./ComparePageClient";

export const metadata: Metadata = { title: "Compare Products" };

export default function ComparePage() {
  return <ComparePageClient />;
}
