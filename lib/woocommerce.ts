// WooCommerce integration point (not yet connected).
//
// When wholesale product data becomes available from a headless WooCommerce
// store, fetch it here using the WooCommerce Store API or WPGraphQL and map
// the response onto the `Product` / `ProductCategoryData` types defined in
// `lib/product.ts`. Keep API keys and consumer secrets in server-only
// environment variables (never `NEXT_PUBLIC_*`) and call WooCommerce only
// from Server Components or Route Handlers so credentials never reach the
// browser.
//
// Example shape once configured:
//
// export async function getProducts(): Promise<Product[]> {
//   const res = await fetch(`${process.env.WOOCOMMERCE_STORE_URL}/wp-json/wc/store/v1/products`, {
//     headers: { Authorization: `Basic ${process.env.WOOCOMMERCE_API_KEY}` },
//   });
//   const data = await res.json();
//   return data.map(mapWooProductToProduct);
// }

export {};
