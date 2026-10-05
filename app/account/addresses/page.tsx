import type { Metadata } from "next";
import { requireAccountPageSession } from "@/lib/server/page-session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";
import { business } from "@/lib/site-config";
import AccountNavigation from "@/components/AccountNavigation";
import AddressesForm from "@/components/AddressesForm";
import AccountUnavailable from "@/components/AccountUnavailable";

export const metadata: Metadata = { title: "Addresses" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const session = await requireAccountPageSession("/account/addresses");
  if (session === "unavailable") return <AccountUnavailable title="Addresses" />;

  const result = await getCustomerProfile(session.sub);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Addresses</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div>
            {result.ok ? (
              <AddressesForm initialBilling={result.data.billing} initialShipping={result.data.shipping} />
            ) : result.reason === "service_unavailable" ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">
                  Saved addresses aren&rsquo;t connected yet. Please call{" "}
                  <a href={business.phoneHref} className="text-gold-dark hover:underline">
                    {business.phone}
                  </a>{" "}
                  to update your address.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">We couldn&rsquo;t load your addresses right now. Please try again shortly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
