import { NextResponse, type NextRequest } from "next/server";
import { getProductsByIds, WooCommerceApiError } from "@/lib/woocommerce";

/**
 * Internal, read-only proxy in front of the WooCommerce Store API's
 * `include` lookup. Wishlist/compare IDs live in the browser's localStorage,
 * so resolving them back to real product data has to happen client-side —
 * calling nagsbeautysupply.com directly from the browser would need CORS
 * headers that Store API doesn't send for this origin. Routing through this
 * same-origin handler avoids that entirely, and keeps every outbound
 * WooCommerce request server-side.
 *
 * GET /api/products?ids=123,456,789
 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getProductsByIds(ids);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof WooCommerceApiError ? error.message : "We couldn't load these products right now.";
    return NextResponse.json({ error: message, products: [] }, { status: 502 });
  }
}
