// Shared product "view model" types rendered by the product UI components
// (ProductCard, ProductGrid, ProductDetail, ProductGallery, StockStatus,
// QuickViewButton, WishlistButton, CompareButton). Real data is fetched
// server-side from the WooCommerce Store API and mapped onto this shape by
// `lib/woocommerce.ts` — see that file for the live integration.

export type StockStatus = "in-stock" | "out-of-stock" | "backorder";
export type ProductType = "simple" | "variable";

export interface ProductImage {
  src: string;
  alt: string;
  /** Natural pixel dimensions, when known — the WooCommerce Store API does not return them for product images, so these are usually omitted for product photos. */
  width?: number;
  height?: number;
}

/** Local, branded fallback used whenever WooCommerce returns no image for a product or category — never a letter placeholder. */
export const PRODUCT_IMAGE_FALLBACK: ProductImage = {
  src: "/product-placeholder.svg",
  alt: "Product image not available",
};

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface ProductVariation {
  id: string;
  /** e.g. { Size: "50ml", Shade: "Ivory" } — matches the parent's `attributes`. */
  attributes: Record<string, string>;
  price: string;
  salePrice?: string;
  stockStatus: StockStatus;
  image?: ProductImage;
}

export interface ProductReviewSummary {
  count: number;
  /** 0–5 */
  averageRating: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  type: ProductType;
  /** Canonical WooCommerce permalink. */
  permalink: string;
  image: ProductImage;
  gallery?: ProductImage[];
  /** Regular (non-sale) price, formatted for display (e.g. "$12.95 CAD") — or "Contact for price" when WooCommerce has no valid price set. */
  price: string;
  /** Sale price, formatted for display — set only when the product is on sale and that sale price is itself valid. */
  salePrice?: string;
  /** False when WooCommerce's price is zero, empty, or otherwise unusable. Cart/pricing UI must not treat such a product as purchasable at $0. */
  hasValidPrice: boolean;
  /** Primary category name, used for filtering/grouping in this frontend. */
  category: string;
  /** Slug of the primary category, for linking back to its /shop/category/[slug] page. */
  primaryCategorySlug?: string;
  /** Full WooCommerce category list, when a product belongs to more than one. */
  categories?: string[];
  tags?: string[];
  attributes?: ProductAttribute[];
  /** Only populated for variable products — this catalogue currently has none. */
  variations?: ProductVariation[];
  /** True for variable products that require an option selection before purchase. */
  hasOptions?: boolean;
  isPurchasable?: boolean;
  /** Plain-text short description — safe for card blurbs and <meta description>. */
  shortDescription: string;
  /** Sanitized HTML short description, safe to render with dangerouslySetInnerHTML. */
  shortDescriptionHtml?: string;
  /** Plain-text full description. */
  description?: string;
  /** Sanitized HTML full description, safe to render with dangerouslySetInnerHTML. */
  descriptionHtml?: string;
  stockStatus: StockStatus;
  stockQuantity?: number;
  /** WooCommerce's human-readable stock line, e.g. "Only 3 left in stock". */
  stockMessage?: string;
  reviews?: ProductReviewSummary;
  /** WooCommerce related product IDs, when provided. */
  relatedIds?: string[];
}

export interface ProductCategoryData {
  id: string;
  slug: string;
  name: string;
  /** Parent category ID, or null for a top-level category. */
  parentId: string | null;
  /** Published product count in this category (as reported by WooCommerce). */
  count: number;
  image?: ProductImage;
  description?: string;
}

// No wholesale product catalogue is bundled statically — live data comes
// from `lib/woocommerce.ts`. This stays empty; it exists only so the
// wishlist/compare pages (which resolve locally-stored product IDs back to
// full product records) and other pre-existing call sites keep compiling.
export const products: Product[] = [];

/** Sale price if set, otherwise regular price — mirrors WooCommerce's `_price`. */
export function getCurrentPrice(product: Pick<Product, "price" | "salePrice">): string {
  return product.salePrice ?? product.price;
}
