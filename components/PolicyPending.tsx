import Link from "next/link";

/**
 * Shared placeholder for a legal/policy page with no verified, business-
 * specific content yet. Renders a clear "content pending" notice instead of
 * inventing policy text. Pair with `robots: { index: false, follow: false }`
 * in the page's metadata so it isn't indexed as final content.
 */
export default function PolicyPending({ title, note }: { title: string; note?: string }) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        <div className="mt-8 rounded-xl border border-dashed border-ink/15 bg-cream p-8">
          <p className="font-semibold text-ink">Content Pending</p>
          <p className="mt-2 text-sm text-ink/60">
            This page is a structural placeholder. Approved, client-confirmed {title.toLowerCase()}{" "}
            text is required before it can be published. It is not indexed by search engines and
            should not be treated as final content.
          </p>
          {note && <p className="mt-3 text-sm text-ink/60">{note}</p>}
        </div>
        <p className="mt-8 text-sm text-ink/60">
          Questions in the meantime?{" "}
          <Link href="/contact" className="text-gold-dark hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
