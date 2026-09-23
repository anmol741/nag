import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/server/session";
import { getCustomerOrders } from "@/lib/server/woocommerce-admin";
import { business } from "@/lib/site-config";
import AccountNavigation from "@/components/AccountNavigation";

export const metadata: Metadata = { title: "Orders" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const dateFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric" });

export default async function AccountOrdersPage() {
  // proxy.ts already redirects a logged-out visitor before this ever
  // renders — this is a second, defense-in-depth check, not the only one.
  const session = await getSession();
  if (!session) return null;

  const result = await getCustomerOrders(session.sub);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-display text-3xl text-ink">Orders</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div>
            {result.ok && result.data.length > 0 && (
              <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10">
                {result.data.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-cream"
                    >
                      <span>
                        <span className="block font-medium text-ink">Order #{order.number}</span>
                        <span className="block text-sm text-ink/60">
                          {dateFormat.format(new Date(order.date))} &middot; {order.status}
                        </span>
                      </span>
                      <span className="font-semibold text-ink">{currency.format(Number.parseFloat(order.total) || 0)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {result.ok && result.data.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">You don&rsquo;t have any orders yet.</p>
              </div>
            )}

            {!result.ok && result.reason === "service_unavailable" && (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">
                  Order history isn&rsquo;t connected yet. Please call{" "}
                  <a href={business.phoneHref} className="text-gold-dark hover:underline">
                    {business.phone}
                  </a>{" "}
                  to check on an order.
                </p>
              </div>
            )}

            {!result.ok && result.reason !== "service_unavailable" && (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">We couldn&rsquo;t load your order history right now. Please try again shortly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
