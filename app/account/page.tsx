import type { Metadata } from "next";
import RequireAccountSession from "@/components/RequireAccountSession";
import AccountNavigation from "@/components/AccountNavigation";
import AccountWelcome from "@/components/AccountWelcome";

export const metadata: Metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <RequireAccountSession>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-3xl text-ink">My Account</h1>
          <AccountWelcome />
          <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
            <AccountNavigation />
            <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
              <p className="text-ink/60">
                Account details, order history, and saved addresses will appear here once customer
                accounts are connected.
              </p>
            </div>
          </div>
        </div>
      </section>
    </RequireAccountSession>
  );
}
