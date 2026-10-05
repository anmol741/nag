import { business } from "@/lib/site-config";

/** Shown by account pages when WordPress can't be reached to verify the session (fail closed — the cookie alone is never trusted for account data). */
export default function AccountUnavailable({ title }: { title: string }) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-md px-6 text-center">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <p className="mt-6 text-ink/60">
          Your account can&rsquo;t be reached right now. Please try again in a few minutes, or call{" "}
          <a href={business.phoneHref} className="text-gold-dark hover:underline">
            {business.phone}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
