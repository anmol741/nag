"use client";

import type { ReactNode } from "react";
import { useAuthSession } from "@/lib/auth";
import LoggedOutAccount from "./LoggedOutAccount";

/**
 * Gates account pages on a real customer session. Since no WooCommerce
 * authentication is connected yet, `useAuthSession()` always returns
 * `null`, so every account page currently renders the logged-out Login
 * screen instead of `children` — never a fake dashboard. Customer account
 * creation is handled by WooCommerce directly once that's connected, so
 * this screen deliberately has no registration form.
 */
export default function RequireAccountSession({ children }: { children: ReactNode }) {
  const session = useAuthSession();

  if (!session) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-md px-6">
          <h1 className="text-center font-display text-3xl text-ink">My Account</h1>
          <div className="mt-10">
            <LoggedOutAccount />
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
