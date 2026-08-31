import Link from "next/link";
import { business, courseCategories, mainNav } from "@/lib/site-config";
import { InstagramIcon, MapPinIcon, PhoneIcon } from "./icons";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-display text-xl tracking-wide text-cream">
              Nag&rsquo;s <span className="text-gold-light">Beauty</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{business.tagline}</p>
            <div className="mt-4 flex items-start gap-2 text-sm text-white/70">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{business.address.full}</span>
            </div>
            <a href={business.phoneHref} className="mt-2 flex items-center gap-2 text-sm text-white/70 hover:text-gold-light">
              <PhoneIcon className="h-4 w-4 text-gold" />
              {business.phone}
            </a>
            <a
              href={business.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 text-sm text-white/70 hover:text-gold-light"
            >
              <InstagramIcon className="h-4 w-4 text-gold" />
              {business.instagram.handle}
            </a>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-gold-light">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Training Categories
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {courseCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/courses?category=${cat.slug}`} className="hover:text-gold-light">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Stay Updated</h3>
            <p className="mt-4 text-sm text-white/60">
              Get notified about new courses, workshops, and wholesale specials.
            </p>
            <div className="mt-3">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>
          <p>Visa &middot; Mastercard &middot; Interac &middot; PayPal</p>
        </div>
      </div>
    </footer>
  );
}
