import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { getCustomerOrder } from "@/lib/server/woocommerce-admin";
import { business } from "@/lib/site-config";
import AccountNavigation from "@/components/AccountNavigation";

export const metadata: Metadata = { title: "Order Details" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const dateFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric" });

function formatAddress(address: { firstName: string; lastName: string; company?: string; addressLine1: string; addressLine2?: string; city: string; province: string; postalCode: string; country: string }) {
  return [
    `${address.firstName} ${address.lastName}`,
    address.company,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.province} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null; // proxy.ts already redirects before this renders

  const { id } = await params;
  const result = await getCustomerOrder(session.sub, id);

  // "not_found" covers both a genuinely missing order and an order that
  // belongs to a different customer — see getCustomerOrder's own comment
  // on why those two cases are deliberately indistinguishable here.
  if (!result.ok && result.reason === "not_found") notFound();

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/account/orders" className="text-sm text-gold-dark hover:underline">
          ← Back to Orders
        </Link>
        <h1 className="mt-3 font-display text-3xl text-ink">
          {result.ok ? `Order #${result.data.number}` : "Order Details"}
        </h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div>
            {result.ok ? (
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-ink/10 bg-cream p-4 text-sm">
                  <span>
                    <span className="text-ink/50">Date: </span>
                    <span className="text-ink">{dateFormat.format(new Date(result.data.date))}</span>
                  </span>
                  <span>
                    <span className="text-ink/50">Status: </span>
                    <span className="text-ink">{result.data.status}</span>
                  </span>
                  <span>
                    <span className="text-ink/50">Total: </span>
                    <span className="font-semibold text-ink">{currency.format(Number.parseFloat(result.data.total) || 0)}</span>
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-lg text-ink">Items</h2>
                  <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10">
                    {result.data.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-4 p-4 text-sm">
                        <span className="text-ink">
                          {item.name} <span className="text-ink/50">&times; {item.quantity}</span>
                        </span>
                        <span className="font-semibold text-ink">{currency.format(Number.parseFloat(item.total) || 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h2 className="font-display text-lg text-ink">Billing Address</h2>
                    <address className="mt-2 space-y-0.5 text-sm not-italic text-ink/70">
                      {formatAddress(result.data.billing).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </address>
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-ink">Shipping Address</h2>
                    <address className="mt-2 space-y-0.5 text-sm not-italic text-ink/70">
                      {formatAddress(result.data.shipping).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </address>
                  </div>
                </div>
              </div>
            ) : result.reason === "service_unavailable" ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">
                  Order details aren&rsquo;t connected yet. Please call{" "}
                  <a href={business.phoneHref} className="text-gold-dark hover:underline">
                    {business.phone}
                  </a>{" "}
                  and reference this order.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">We couldn&rsquo;t load this order right now. Please try again shortly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
