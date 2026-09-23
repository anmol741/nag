"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { business, courseCategories } from "@/lib/site-config";
import { useCart } from "@/lib/cart";
import { closeMiniCart, openMiniCart, useMiniCartOpen } from "@/lib/mini-cart";
import { useStoredIds } from "@/lib/local-store";
import { WISHLIST_STORAGE_KEY } from "./WishlistButton";
import MiniCart from "./MiniCart";
import SocialLinks from "./SocialLinks";
import { BagIcon, ChevronDownIcon, CloseIcon, HeartIcon, MenuIcon, PhoneIcon, UserIcon } from "./icons";

function useCloseOnOutsideOrEscape(
  active: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [active, onClose, containerRef]);
}

/**
 * Most pages under the root layout are statically generated and can be
 * served from a CDN cache to many different visitors, so the session
 * can't be resolved server-side in the layout and baked into that shared
 * HTML — see app/layout.tsx's comment. Instead, `loggedIn` starts `false`
 * (matching both the server-rendered HTML and the client's very first
 * render, so there's no hydration mismatch) and is corrected right after
 * mount via GET /api/auth/session, which returns only a boolean — no
 * email, no customer ID ever reaches this component or any other client
 * code. This trades a brief post-mount flash on a first page load for
 * keeping the rest of the site's static-generation performance intact.
 */
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const cartOpen = useMiniCartOpen();
  const { lines: cartLines } = useCart();
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const wishlistCount = useStoredIds(WISHLIST_STORAGE_KEY).length;

  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsideOrEscape(accountOpen, () => setAccountOpen(false), accountRef);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { loggedIn?: boolean } | null) => {
        if (!cancelled && data) setLoggedIn(Boolean(data.loggedIn));
      })
      .catch(() => {
        // Leave loggedIn at its false default — same as a logged-out visitor.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setAccountOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — the cookie is HttpOnly and short-lived regardless.
    }
    setLoggedIn(false);
    router.push("/account");
    router.refresh();
  }

  const [coursesOpen, setCoursesOpen] = useState(false);
  const coursesRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsideOrEscape(coursesOpen, () => setCoursesOpen(false), coursesRef);

  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsideOrEscape(contactOpen, () => setContactOpen(false), contactRef);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  const navLinkClass = (href: string) =>
    `text-sm font-medium hover:text-gold-light ${isActive(href) ? "text-gold-light" : ""}`;

  return (
    <header className="sticky top-0 z-50 bg-ink text-cream">
      {/* Utility bar */}
      <div className="hidden border-b border-white/10 bg-black md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs tracking-wide text-white/70">
          <div className="flex items-center gap-5">
            <a href={business.phoneHref} className="flex items-center gap-1.5 hover:text-gold-light">
              <PhoneIcon className="h-3.5 w-3.5" />
              {business.phone}
            </a>
            <SocialLinks iconClassName="h-3.5 w-3.5" showHandle={false} />
          </div>
          <div className="flex items-center gap-4">
            <span>{business.hours}</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6">
        <Link href="/" className="min-w-0 shrink" onClick={() => setMobileOpen(false)}>
          {/* Tracking/size step down at the smallest widths — at
              tracking-[0.3em] the subtitle alone is ~230px wide, wider than
              a 320px viewport's available content width once header
              padding and the cart/menu icons are accounted for. */}
          <span className="font-display text-lg tracking-wide text-cream sm:text-2xl">
            Nag&rsquo;s <span className="text-gold-light">Beauty</span>
          </span>
          <span className="block truncate text-[0.5rem] uppercase tracking-[0.08em] text-white/50 sm:text-[0.65rem] sm:tracking-[0.3em]">
            Supplies &amp; Training Center
          </span>
        </Link>

        {/* Desktop nav — starts at lg (1024px), not md (768px): at 768px
            this nav's five items (four links plus Enroll Now) don't fit on
            one line each, and every single one wraps to two lines (e.g.
            "About" / "Us"), confirmed via measurement. The mobile nav below
            already renders cleanly at 768px, so it now covers 768–1023px too. */}
        <nav className="hidden items-center gap-7 lg:flex">
          <Link href="/about" className={navLinkClass("/about")}>
            About Us
          </Link>

          <div
            className="relative"
            ref={coursesRef}
            onMouseEnter={() => setCoursesOpen(true)}
            onMouseLeave={() => setCoursesOpen(false)}
          >
            <span className="flex items-center gap-1">
              <Link href="/courses" className={navLinkClass("/courses")}>
                Training Courses
              </Link>
              <button
                type="button"
                aria-label="Toggle training course categories"
                aria-expanded={coursesOpen}
                aria-controls="courses-dropdown"
                onClick={() => setCoursesOpen((v) => !v)}
                className="p-1 hover:text-gold-light"
              >
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
            </span>
            {coursesOpen && (
              <div id="courses-dropdown" className="absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3">
                <div className="rounded-lg border border-white/10 bg-ink-soft p-2 shadow-xl">
                  {courseCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/courses?category=${cat.slug}`}
                      className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                      onClick={() => setCoursesOpen(false)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                  <div className="mt-1 border-t border-white/10 pt-1">
                    <Link
                      href="/courses"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-gold-light hover:bg-white/5"
                      onClick={() => setCoursesOpen(false)}
                    >
                      View All Courses →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/shop" className={navLinkClass("/shop")}>
            Shop Online
          </Link>

          <div
            className="relative"
            ref={contactRef}
            onMouseEnter={() => setContactOpen(true)}
            onMouseLeave={() => setContactOpen(false)}
          >
            <span className="flex items-center gap-1">
              <Link href="/contact" className={navLinkClass("/contact")}>
                Contact Us
              </Link>
              <button
                type="button"
                aria-label="Toggle contact options"
                aria-expanded={contactOpen}
                aria-controls="contact-dropdown"
                onClick={() => setContactOpen((v) => !v)}
                className="p-1 hover:text-gold-light"
              >
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
            </span>
            {contactOpen && (
              <div id="contact-dropdown" className="absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3">
                <div className="rounded-lg border border-white/10 bg-ink-soft p-2 shadow-xl">
                  <Link
                    href="/contact"
                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                    onClick={() => setContactOpen(false)}
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/newsletter"
                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                    onClick={() => setContactOpen(false)}
                  >
                    Newsletter &amp; Course Updates
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/enroll"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
          >
            Enroll Now
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {loggedIn ? (
            <div className="relative hidden lg:block" ref={accountRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                aria-controls="account-dropdown"
                onClick={() => setAccountOpen((v) => !v)}
                className="hover:text-gold-light"
              >
                <UserIcon className="h-5 w-5" />
              </button>
              {accountOpen && (
                <div id="account-dropdown" className="absolute right-0 top-full w-56 pt-3">
                  <div className="rounded-lg border border-white/10 bg-ink-soft p-2 shadow-xl">
                    <Link
                      href="/account"
                      className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                      onClick={() => setAccountOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                      onClick={() => setAccountOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/account/addresses"
                      className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                      onClick={() => setAccountOpen(false)}
                    >
                      Addresses
                    </Link>
                    <div className="mt-1 border-t border-white/10 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gold-light hover:bg-white/5"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/account" aria-label="Account — log in" className="hidden lg:block hover:text-gold-light">
              <UserIcon className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}` : ""}`}
            className="relative hidden shrink-0 lg:block hover:text-gold-light"
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-ink">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
            onClick={openMiniCart}
            className="relative shrink-0 hover:text-gold-light"
          >
            <BagIcon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </button>
          <button
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-white/10 bg-ink px-4 py-4 sm:px-6 lg:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 ${isActive("/") ? "text-gold-light" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 ${isActive("/about") ? "text-gold-light" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/courses"
              className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 ${isActive("/courses") ? "text-gold-light" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Training Courses
            </Link>
            <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
              {courseCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/courses?category=${cat.slug}`}
                  className="rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link
              href="/shop"
              className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 ${isActive("/shop") ? "text-gold-light" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Shop Online
            </Link>
            <Link
              href="/contact"
              className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5 ${isActive("/contact") ? "text-gold-light" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Contact Us
            </Link>
            <Link href="/newsletter" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Newsletter &amp; Course Updates
            </Link>
            <Link
              href="/enroll"
              className="mt-2 rounded-md bg-gold px-2 py-2 text-center text-sm font-semibold text-ink hover:bg-gold-light"
              onClick={() => setMobileOpen(false)}
            >
              Enroll Now
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3">
              <Link href="/account" className="text-sm hover:text-gold-light" onClick={() => setMobileOpen(false)}>
                {loggedIn ? "My Account" : "Account"}
              </Link>
              {loggedIn && (
                <>
                  <Link href="/account/orders" className="text-sm hover:text-gold-light" onClick={() => setMobileOpen(false)}>
                    Orders
                  </Link>
                  <button
                    type="button"
                    className="text-sm hover:text-gold-light"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                  >
                    Log Out
                  </button>
                </>
              )}
              <Link href="/wishlist" className="text-sm hover:text-gold-light" onClick={() => setMobileOpen(false)}>
                Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
              </Link>
              <button
                type="button"
                className="text-sm hover:text-gold-light"
                onClick={() => {
                  setMobileOpen(false);
                  openMiniCart();
                }}
              >
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </button>
              <a href={business.phoneHref} className="ml-auto flex items-center gap-1.5 text-sm text-gold-light">
                <PhoneIcon className="h-4 w-4" />
                {business.phone}
              </a>
            </div>
          </nav>
        </div>
      )}

      <MiniCart open={cartOpen} onClose={closeMiniCart} />
    </header>
  );
}
