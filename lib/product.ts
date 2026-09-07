// Product types shaped to map cleanly onto a future headless WooCommerce
// integration (WooCommerce Store API / WPGraphQL). No live data source is
// connected yet — see the integration note in `lib/woocommerce.ts`. The
// arrays below are intentionally empty (no fake product records) until that
// integration is wired up; pages and components are already built to render
// their integration-pending / empty states against this shape.

import { shopCategoriesFallback } from "./shop-categories";

export type StockStatus = "in-stock" | "out-of-stock" | "backorder";
export type ProductType = "simple" | "variable";

export interface ProductImage {
  src: string;
  alt: string;
  /** Natural pixel dimensions, used to render the image at its true aspect ratio. */
  width: number;
  height: number;
}

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
  /** Canonical WooCommerce permalink, once connected. */
  permalink: string;
  image: ProductImage;
  gallery?: ProductImage[];
  /** Regular (non-sale) price. */
  price: string;
  salePrice?: string;
  /** Primary category name, used for filtering/grouping in this frontend. */
  category: string;
  /** Full WooCommerce category list, when a product belongs to more than one. */
  categories?: string[];
  tags?: string[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  shortDescription: string;
  description?: string;
  stockStatus: StockStatus;
  stockQuantity?: number;
  reviews?: ProductReviewSummary;
  /** WooCommerce's `related_ids`, when provided — preferred over the category-match fallback below. */
  relatedIds?: string[];
}

export interface ProductCategoryData {
  slug: string;
  name: string;
  image?: ProductImage;
  description?: string;
}

// Derived from the temporary WooCommerce-parent-category fallback list in
// `lib/shop-categories.ts` — see that file for the replacement plan.
export const productCategories: ProductCategoryData[] = shopCategoriesFallback.map((c) => ({
  slug: c.slug,
  name: c.name,
  image: c.image,
}));

// No wholesale product catalogue is connected yet — see `lib/woocommerce.ts`.
export const products: Product[] = [];

/** Sale price if set, otherwise regular price — mirrors WooCommerce's `_price`. */
export function getCurrentPrice(product: Pick<Product, "price" | "salePrice">): string {
  return product.salePrice ?? product.price;
}

export function getProductCategoryBySlug(slug: string): ProductCategoryData | undefined {
  return productCategories.find((c) => c.slug === slug);
}

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  const category = getProductCategoryBySlug(categorySlug);
  if (!category) return [];
  return products.filter((p) => p.category === category.name);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)
  );
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  if (product.relatedIds && product.relatedIds.length > 0) {
    const byId = product.relatedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
    if (byId.length > 0) return byId.slice(0, limit);
  }
  return products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, limit);
}
