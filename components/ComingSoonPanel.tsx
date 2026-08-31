import Link from "next/link";

export default function ComingSoonPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-lg px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 font-display text-2xl text-gold-dark mx-auto">
          N
        </span>
        <h1 className="mt-6 font-display text-3xl text-ink">{title}</h1>
        <p className="mt-3 text-ink/60">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-light">
            Shop Online
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:border-gold hover:text-gold-dark"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
