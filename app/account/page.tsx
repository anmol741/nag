import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/server/session";
import { getCustomerProfile } from "@/lib/server/woocommerce-admin";
import { isSafeReturnPath } from "@/lib/validation";
import { business } from "@/lib/site-config";
import LoginForm from "@/components/LoginForm";
import AccountNavigation from "@/components/AccountNavigation";

export const metadata: Metadata = { title: "My Account" };
// Must render per-request, never prerendered — it reflects the visitor's
// own session. Forced explicitly rather than relying on Next.js's
// automatic dynamic-API detection: getSession() intentionally short-
// circuits before calling cookies() when SESSION_SECRET is unset (see its
// own comment on why), which would otherwise make this look "static" to
// that detection and get build-time-frozen into the logged-out view for
// everyone, including a visitor who really is logged in.
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const session = await getSession();
  const { returnTo } = await searchParams;
  // Validated once, here, server-side — LoginForm and the "create account"
  // link below both trust this value as-is rather than re-validating it.
  const safeReturnTo = isSafeReturnPath(returnTo) ? returnTo : undefined;

  if (!session) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-md px-6">
          <h1 className="text-center font-display text-3xl text-ink">My Account</h1>

          {safeReturnTo && (
            <p role="status" className="mt-4 rounded-md border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm text-ink/80">
              Please log in or create an account before continuing to checkout.
            </p>
          )}

          <div className="mt-10">
            <LoginForm returnTo={safeReturnTo} />
            <p className="mt-6 text-center text-sm text-ink/60">
              New here?{" "}
              <Link
                href={safeReturnTo ? `/account/register?returnTo=${encodeURIComponent(safeReturnTo)}` : "/account/register"}
                className="text-gold-dark hover:underline"
              >
                Create an account
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  const profileResult = await getCustomerProfile(session.sub);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">My Account</h1>
        <p className="mt-2 text-ink/60">
          Welcome back{profileResult.ok ? `, ${profileResult.data.firstName}` : ""}.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div className="rounded-xl border border-ink/10 bg-cream p-8">
            {profileResult.ok ? (
              <dl className="space-y-3 text-sm text-ink/70">
                <div>
                  <dt className="font-semibold text-ink">Name</dt>
                  <dd>
                    {profileResult.data.firstName} {profileResult.data.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Email</dt>
                  <dd>{profileResult.data.email}</dd>
                </div>
                {profileResult.data.salonName && (
                  <div>
                    <dt className="font-semibold text-ink">Salon/Spa</dt>
                    <dd>{profileResult.data.salonName}</dd>
                  </div>
                )}
              </dl>
            ) : profileResult.reason === "service_unavailable" ? (
              <p className="text-center text-ink/60">
                Full account details aren&rsquo;t connected yet. Please call{" "}
                <a href={business.phoneHref} className="text-gold-dark hover:underline">
                  {business.phone}
                </a>{" "}
                for help with your account.
              </p>
            ) : (
              <p className="text-center text-ink/60">We couldn&rsquo;t load your account details right now. Please try again shortly.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
