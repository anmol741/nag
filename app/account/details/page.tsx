import type { Metadata } from "next";
import { getSession } from "@/lib/server/session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";
import { business } from "@/lib/site-config";
import AccountNavigation from "@/components/AccountNavigation";
import AccountDetailsForm from "@/components/AccountDetailsForm";

export const metadata: Metadata = { title: "Account Details" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

export default async function AccountDetailsPage() {
  const session = await getSession();
  if (!session) return null; // proxy.ts already redirects before this renders

  const result = await getCustomerProfile(session.sub);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Account Details</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div>
            {result.ok ? (
              <AccountDetailsForm
                initial={{
                  firstName: result.data.firstName,
                  lastName: result.data.lastName,
                  email: result.data.email,
                  phone: result.data.billing.phone ?? "",
                  salonName: result.data.salonName ?? "",
                  certification: result.data.certification ?? "",
                }}
              />
            ) : result.reason === "service_unavailable" ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">
                  Profile editing isn&rsquo;t connected yet. Please call{" "}
                  <a href={business.phoneHref} className="text-gold-dark hover:underline">
                    {business.phone}
                  </a>{" "}
                  to update your details.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">We couldn&rsquo;t load your account details right now. Please try again shortly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
