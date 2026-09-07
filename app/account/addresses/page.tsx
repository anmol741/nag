import type { Metadata } from "next";
import RequireAccountSession from "@/components/RequireAccountSession";
import AccountNavigation from "@/components/AccountNavigation";

export const metadata: Metadata = { title: "Addresses" };

export default function AccountAddressesPage() {
  return (
    <RequireAccountSession>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-3xl text-ink">Addresses</h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
            <AccountNavigation />
            <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
              <p className="text-ink/60">
                Saved billing and shipping addresses will appear here once customer accounts are
                connected.
              </p>
            </div>
          </div>
        </div>
      </section>
    </RequireAccountSession>
  );
}
