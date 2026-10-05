import { commerce } from "@/lib/site-config";

const currency = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

/**
 * e-Transfer payment instructions. Shown at checkout (before ordering, no
 * amount/order number yet) and on the order page (with both). Makes the
 * unpaid status explicit — the order isn't paid until the transfer arrives.
 */
export default function ETransferInstructions({ amount, orderNumber }: { amount?: number; orderNumber?: string }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-cream p-5 text-sm text-ink/80">
      <p className="font-semibold text-ink">How to pay by Interac e-Transfer</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        <li>
          Send {amount !== undefined ? <strong className="text-ink">{currency.format(amount)}</strong> : "your order total"} by Interac
          e-Transfer to <strong className="break-all text-ink">{commerce.eTransferEmail}</strong>.
        </li>
        <li>
          {orderNumber ? (
            <>
              Put your order number <strong className="text-ink">#{orderNumber}</strong> in the transfer message.
            </>
          ) : (
            <>Put your order number (shown after you place the order) in the transfer message.</>
          )}
        </li>
        <li>We&rsquo;ll email you when the payment is received and your order is being processed.</li>
      </ol>
      <p className="mt-3 rounded-md bg-white px-3 py-2 text-ink">
        <strong>Your order is not paid until we receive your transfer.</strong> Orders not paid within {commerce.unpaidETransferCancelDays} days are
        cancelled automatically and the items are released.
      </p>
    </div>
  );
}
