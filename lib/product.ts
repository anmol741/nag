// Product types shaped to map cleanly onto a future headless WooCommerce
// integration (WooCommerce Store API / WPGraphQL). No live data source is
// connected yet — see the integration note in `lib/woocommerce.ts`. The
// arrays below are intentionally empty (no fake product records) until that
// integration is wired up; pages and components are already built to render
// their integration-pending / empty states against this shape.

import { shopCategoryImages } from "./media";

export type StockStatus = "in-stock" | "out-of-stock" | "backorder";

export interface ProductImage {
  src: string;
  alt: string;
  /** Natural pixel dimensions, used to render the image at its true aspect ratio. */
  width: number;
  height: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  image: ProductImage;
  gallery?: ProductImage[];
  price: string;
  salePrice?: string;
  category: string;
  tags?: string[];
  shortDescription: string;
  description?: string;
  stockStatus: StockStatus;
}

export interface ProductCategoryData {
  slug: string;
  name: string;
  image?: ProductImage;
  description?: string;
}

export const productCategories: ProductCategoryData[] = [
  "Facials & Skin Care",
  "Makeup Application",
  "Eyelash Extensions & Tinting",
  "Manicure & Pedicure",
  "Waxing & Body Treatments",
  "Aromatherapy",
  "Laser & Medical Esthetics",
  "PMU & Microblading Tools",
].map((name) => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  image: shopCategoryImages[name],
}));

// No wholesale product catalogue is connected yet — see `lib/woocommerce.ts`.
export const products: Product[] = [];

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
  return products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, limit);
}
