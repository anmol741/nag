import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccountPageSession } from "@/lib/server/page-session";
import { getCustomerOrder, orderStatusLabel, type Address } from "@/lib/server/woocommerce-admin";
import { business, commerce } from "@/lib/site-config";
import AccountNavigation from "@/components/AccountNavigation";
import AccountUnavailable from "@/components/AccountUnavailable";
import ETransferInstructions from "@/components/ETransferInstructions";

export const metadata: Metadata = { title: "Order Details" };
// See app/account/page.tsx's comment — same reasoning applies here.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const dateFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric" });

const ETRANSFER_METHOD_ID = "nag_etransfer";

function money(value: string): string {
  return currency.format(Number.parseFloat(value) || 0);
}

function formatAddress(address: Address) {
  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.company,
    address.addressLine1,
    address.addressLine2,
    [address.city, [address.province, address.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!/^[1-9]\d{0,11}$/.test(id)) notFound();

  const session = await requireAccountPageSession(`/account/orders/${id}`);
  if (session === "unavailable") return <AccountUnavailable title="Order Details" />;

  const result = await getCustomerOrder(session.sub, id);

  // "not_found" covers both a missing order and an order that belongs to a
  // different customer — deliberately indistinguishable (no IDOR probing).
  if (!result.ok && result.reason === "not_found") notFound();

  const order = result.ok ? result.data : null;
  const awaitingETransfer = order?.paymentMethod === ETRANSFER_METHOD_ID && order.status === "on-hold";

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/account/orders" className="text-sm text-gold-dark hover:underline">
          ← Back to Orders
        </Link>
        <h1 className="mt-3 font-display text-3xl text-ink">{order ? `Order #${order.number}` : "Order Details"}</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
          <AccountNavigation />
          <div>
            {order ? (
              <div className="space-y-8">
                {placed === "1" && (
                  <div role="status" className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm text-ink">
                    <p className="font-semibold">Thank you — your order has been received.</p>
                    <p className="mt-1 text-ink/70">A confirmation has been emailed to you.</p>
                  </div>
                )}

                {awaitingETransfer && <ETransferInstructions amount={Number.parseFloat(order.total) || 0} orderNumber={order.number} />}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-ink/10 bg-cream p-4 text-sm">
                  <span>
                    <span className="text-ink/50">Date: </span>
                    <span className="text-ink">{dateFormat.format(new Date(order.date))}</span>
                  </span>
                  <span>
                    <span className="text-ink/50">Status: </span>
                    <span className="text-ink">{orderStatusLabel(order.status)}</span>
                  </span>
                  {order.paymentMethodTitle && (
                    <span>
                      <span className="text-ink/50">Payment: </span>
                      <span className="text-ink">{order.paymentMethodTitle}</span>
                    </span>
                  )}
                  <span>
                    <span className="text-ink/50">Total: </span>
                    <span className="font-semibold text-ink">{money(order.total)}</span>
                  </span>
                </div>

                {order.isLocalPickup && (
                  <div className="rounded-xl border border-ink/10 p-4 text-sm text-ink/80">
                    <p className="font-semibold text-ink">{order.pickupReady ? "Your order is ready for pickup" : "Local pickup"}</p>
                    <p className="mt-1">{commerce.pickupLocation}</p>
                    <p>Pickup hours: {commerce.pickupHours}</p>
                    {!order.pickupReady && <p className="mt-1 text-ink/60">We&rsquo;ll email you when your order is ready to collect.</p>}
                  </div>
                )}

                {order.course && (
                  <div className="rounded-xl border border-ink/10 p-4 text-sm text-ink/80">
                    <p className="font-semibold text-ink">{order.course.title}</p>
                    <p className="mt-1">
                      Payment type: {order.course.paymentType === "deposit" ? "Deposit" : "Full payment"} · Course price: {money(order.course.coursePrice)}
                    </p>
                    {order.course.paymentType === "deposit" && <p>Remaining balance: {money(order.course.remainingBalance)}</p>}
                  </div>
                )}

                <div>
                  <h2 className="font-display text-lg text-ink">Items</h2>
                  <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-4 p-4 text-sm">
                        <span className="text-ink">
                          {item.name} <span className="text-ink/50">&times; {item.quantity}</span>
                          {item.options.length > 0 && <span className="block text-xs text-ink/50">{item.options.join(" · ")}</span>}
                        </span>
                        <span className="font-semibold text-ink">{money(item.total)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink/60">Subtotal</dt>
                      <dd className="text-ink">{money(order.subtotal)}</dd>
                    </div>
                    {(Number.parseFloat(order.discountTotal) || 0) > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink/60">Discount{order.coupons.length > 0 ? ` (${order.coupons.join(", ")})` : ""}</dt>
                        <dd className="text-ink">−{money(order.discountTotal)}</dd>
                      </div>
                    )}
                    {order.shippingMethods.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink/60">{order.shippingMethods.map((s) => s.title).join(", ")}</dt>
                        <dd className="text-ink">{money(order.shippingTotal)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink/60">Tax</dt>
                      <dd className="text-ink">{money(order.totalTax)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-ink/10 pt-2 font-semibold">
                      <dt className="text-ink">Total</dt>
                      <dd className="text-ink">{money(order.total)}</dd>
                    </div>
                  </dl>
                </div>

                {order.customerNote && (
                  <div>
                    <h2 className="font-display text-lg text-ink">Order Notes</h2>
                    {/* Rendered as text — React escapes it. */}
                    <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{order.customerNote}</p>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h2 className="font-display text-lg text-ink">Billing Address</h2>
                    <address className="mt-2 space-y-0.5 text-sm not-italic text-ink/70">
                      {formatAddress(order.billing).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </address>
                  </div>
                  {!order.isLocalPickup && (
                    <div>
                      <h2 className="font-display text-lg text-ink">Shipping Address</h2>
                      <address className="mt-2 space-y-0.5 text-sm not-italic text-ink/70">
                        {formatAddress(order.shipping).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </address>
                    </div>
                  )}
                </div>
              </div>
            ) : !result.ok && result.reason === "service_unavailable" ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream p-8 text-center">
                <p className="text-ink/60">
                  Order details aren&rsquo;t available right now. Please call{" "}
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
