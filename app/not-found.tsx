import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-lg px-6 text-center">
        <p className="font-display text-6xl text-gold-dark">404</p>
        <h1 className="mt-4 font-display text-3xl text-ink">Page Not Found</h1>
        <p className="mt-3 text-ink/60">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light">
            Back to Home
          </Link>
          <Link
            href="/courses"
            className="rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-gold hover:text-gold-dark"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
