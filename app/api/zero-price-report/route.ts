import { NextResponse } from "next/server";
import { getZeroPriceReport } from "@/lib/woocommerce";

/**
 * Read-only diagnostic: lists every product this server has seen with a
 * zero, empty, or invalid WooCommerce price (see lib/woocommerce.ts). This
 * is an in-memory log, not a database — it only reflects products fetched
 * since the server process last started/restarted, and resets on redeploy.
 * Intended for internal/developer use while the pricing data is corrected
 * in WooCommerce Admin; it does not modify WooCommerce in any way.
 */
export async function GET() {
  return NextResponse.json({ products: getZeroPriceReport() });
}
