"use client";

import Link from "next/link";
import { useState } from "react";
import { business, courseCategories } from "@/lib/site-config";
import {
  BagIcon,
  ChevronDownIcon,
  CloseIcon,
  HeartIcon,
  InstagramIcon,
  MenuIcon,
  PhoneIcon,
  UserIcon,
} from "./icons";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

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
            <a
              href={business.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gold-light"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              {business.instagram.handle}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>{business.hours}</span>
            <Link href="/login" className="hover:text-gold-light">
              Log In
            </Link>
            <Link href="/register" className="hover:text-gold-light">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
          <span className="font-display text-2xl tracking-wide text-cream">
            Nag&rsquo;s <span className="text-gold-light">Beauty</span>
          </span>
          <span className="block text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
            Supplies &amp; Training Center
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/about" className="text-sm font-medium hover:text-gold-light">
            About Us
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setCoursesOpen(true)}
            onMouseLeave={() => setCoursesOpen(false)}
          >
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium hover:text-gold-light"
            >
              Training Courses
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </Link>
            {coursesOpen && (
              <div className="absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3">
                <div className="rounded-lg border border-white/10 bg-ink-soft p-2 shadow-xl">
                  {courseCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/courses?category=${cat.slug}`}
                      className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                    >
                      {cat.label}
                    </Link>
                  ))}
                  <div className="mt-1 border-t border-white/10 pt-1">
                    <Link
                      href="/courses"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-gold-light hover:bg-white/5"
                    >
                      View All Courses →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/shop" className="text-sm font-medium hover:text-gold-light">
            Shop Online
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setContactOpen(true)}
            onMouseLeave={() => setContactOpen(false)}
          >
            <Link
              href="/contact"
              className="flex items-center gap-1 text-sm font-medium hover:text-gold-light"
            >
              Contact Us
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </Link>
            {contactOpen && (
              <div className="absolute left-1/2 top-full w-44 -translate-x-1/2 pt-3">
                <div className="rounded-lg border border-white/10 bg-ink-soft p-2 shadow-xl">
                  <Link
                    href="/contact"
                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-gold-light"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/wishlist" aria-label="Wishlist" className="hidden md:block hover:text-gold-light">
            <HeartIcon className="h-5 w-5" />
          </Link>
          <Link href="/login" aria-label="Account" className="hidden md:block hover:text-gold-light">
            <UserIcon className="h-5 w-5" />
          </Link>
          <Link href="/cart" aria-label="Cart" className="hover:text-gold-light">
            <BagIcon className="h-5 w-5" />
          </Link>
          <button
            aria-label="Toggle menu"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-ink px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link href="/" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              About Us
            </Link>
            <Link href="/courses" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
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
            <Link href="/shop" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Shop Online
            </Link>
            <Link href="/contact" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Contact Us
            </Link>
            <Link href="/signup" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/5" onClick={() => setMobileOpen(false)}>
              Sign Up
            </Link>
            <div className="mt-2 flex items-center gap-4 border-t border-white/10 pt-3">
              <Link href="/login" className="text-sm hover:text-gold-light" onClick={() => setMobileOpen(false)}>
                Log In
              </Link>
              <Link href="/wishlist" className="text-sm hover:text-gold-light" onClick={() => setMobileOpen(false)}>
                Wishlist
              </Link>
              <a href={business.phoneHref} className="ml-auto flex items-center gap-1.5 text-sm text-gold-light">
                <PhoneIcon className="h-4 w-4" />
                {business.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
