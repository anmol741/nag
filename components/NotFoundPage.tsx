import Link from "next/link";

/** Shared branded 404 body, used by the root not-found.tsx and the route-level not-found.tsx files for /products/[slug] and /shop/category/[slug]. Each of those files sets its own `metadata` export — see the note on app/not-found.tsx for why. */
export default function NotFoundPage() {
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
