"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { label: "Account Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Account Details", href: "/account/details" },
  { label: "Wishlist", href: "/wishlist" },
];

// Only ever rendered on an authenticated account page, so a logged-out
// visitor never sees this nav or the Log Out action.
export default function AccountNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — the session cookie is short-lived regardless, and
      // router.refresh() below re-reads the real (now server-verified)
      // session state either way.
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="space-y-1 rounded-xl border border-ink/10 bg-cream p-3">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gold/40 ${
              active ? "bg-ink text-cream" : "text-ink/70 hover:bg-white hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-ink/70 transition-colors hover:bg-white hover:text-ink focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        Log Out
      </button>
    </nav>
  );
}
