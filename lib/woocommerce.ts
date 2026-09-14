// Read-only WooCommerce Store API integration.
//
// This WordPress site exposes its REST API through query-based routes
// (`/?rest_route=...`) rather than the usual `/wp-json/...` path, so every
// request below is built against that base. The Store API is public and
// requires no credentials — nothing secret is stored in this project.
//
// Every request is cached via Next.js's fetch data cache
// (`next: { revalidate: 300 }`), so WordPress is hit at most once per five
// minutes per unique query, no matter how many requests this app serves in
// between.
//
// This file is READ-ONLY: it only ever issues GET requests against the
// public `/wc/store/v1/products` and `/wc/store/v1/products/categories`
// endpoints. It does not create orders, touch the cart, or write anything
// back to WooCommerce.

import sanitizeHtml from "sanitize-html";
import { decode as decodeHtml } from "he";
import {
  PRODUCT_IMAGE_FALLBACK,
  type Product,
  type ProductAttribute,
  type ProductCategoryData,
  type ProductImage,
  type StockStatus,
} from "./product";

const STORE_URL = (process.env.WOOCOMMERCE_STORE_URL ?? "https://nagsbeautysupply.com").replace(/\/+$/, "");
const STORE_API_PATH = "/wc/store/v1";
const REVALIDATE_SECONDS = 300;

/** Thrown for any WooCommerce request failure. Carries a message that is always safe to show to a customer — technical detail is logged separately, never included here. */
export class WooCommerceApiError extends Error {
  constructor(message = "We couldn't load products right now. Please try again shortly.") {
    super(message);
    this.name = "WooCommerceApiError";
  }
}

// ---------------------------------------------------------------------------
// Raw WooCommerce Store API types (as returned over the wire)
// ---------------------------------------------------------------------------

export interface WooCommercePrice {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: { min_amount: string; max_amount: string } | null;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface WooCommerceImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface WooCommerceTermRef {
  id: number;
  name: string;
  slug: string;
  link?: string;
}

export interface WooCommerceAttributeTerm {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  taxonomy?: string;
  has_variations?: boolean;
  terms: WooCommerceAttributeTerm[];
}

export interface WooCommerceVariationRef {
  id: number;
  attributes: { name: string; value: string }[];
}

export interface StockAvailability {
  text: string;
  class: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  parent: number;
  type: string;
  variation: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: WooCommercePrice;
  price_html: string;
  average_rating: string;
  review_count: number;
  images: WooCommerceImage[];
  categories: WooCommerceTermRef[];
  tags: WooCommerceTermRef[];
  brands?: WooCommerceTermRef[];
  attributes: WooCommerceAttribute[];
  variations: WooCommerceVariationRef[];
  has_options: boolean;
  is_purchasable: boolean;
  is_in_stock: boolean;
  is_on_backorder: boolean;
  low_stock_remaining: number | null;
  stock_availability: StockAvailability;
  sold_individually: boolean;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: WooCommerceImage | null;
  permalink: string;
}

// ---------------------------------------------------------------------------
// HTML / entity helpers
// ---------------------------------------------------------------------------

/** WordPress content commonly contains named (&amp;) and numeric (&#8217;) entities — decode both to real characters for plain-text display. */
function decodeEntities(text: string): string {
  return decodeHtml(text ?? "");
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "span",
    "ul", "ol", "li", "h3", "h4", "h5", "blockquote", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    span: ["style"],
  },
  allowedStyles: {
    span: { color: [/^#[0-9a-fA-F]{3,6}$/] },
  },
  allowedSchemes: ["http", "https"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

/** Sanitizes WooCommerce/WordPress description HTML to a safe subset, suitable for dangerouslySetInnerHTML. */
function sanitizeDescriptionHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/** Strips all markup and decodes entities, producing plain text for card blurbs and <meta description>. */
function toPlainText(html: string): string {
  if (!html) return "";
  const textOnly = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(textOnly).replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Price / stock formatting
// ---------------------------------------------------------------------------

/**
 * Formats a WooCommerce Store API price using its own `currency_minor_unit`
 * and separators, instead of assuming two decimal places or US formatting.
 * `{ price: "1295", currency_minor_unit: 2, currency_prefix: "$", currency_suffix: "", currency_code: "CAD" }`
 * becomes `"$12.95 CAD"`.
 */
export function formatWooPrice(prices: WooCommercePrice, minorAmount: string = prices.price): string {
  const minorUnit = Number.isFinite(prices.currency_minor_unit) ? prices.currency_minor_unit : 2;
  const cents = Number.parseInt(minorAmount, 10);
  const amount = Number.isFinite(cents) ? cents / 10 ** minorUnit : 0;

  const fixed = amount.toFixed(minorUnit);
  const [wholePart, fractionPart] = fixed.split(".");
  const withThousands = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, prices.currency_thousand_separator || ",");
  const numeric = fractionPart ? `${withThousands}${prices.currency_decimal_separator || "."}${fractionPart}` : withThousands;

  const amountDisplay = `${prices.currency_prefix ?? ""}${numeric}${prices.currency_suffix ?? ""}`;
  return prices.currency_code ? `${amountDisplay} ${prices.currency_code}` : amountDisplay;
}

function mapStockStatus(raw: Pick<WooCommerceProduct, "is_in_stock" | "is_on_backorder">): StockStatus {
  if (!raw.is_in_stock && raw.is_on_backorder) return "backorder";
  if (!raw.is_in_stock) return "out-of-stock";
  return "in-stock";
}

// ---------------------------------------------------------------------------
// Mapping: raw WooCommerce shapes -> this app's Product / category view models
// ---------------------------------------------------------------------------

function mapImage(image: WooCommerceImage, fallbackAlt: string): ProductImage {
  return { src: image.src, alt: decodeEntities(image.alt) || fallbackAlt };
}

function mapAttribute(attribute: WooCommerceAttribute): ProductAttribute {
  return {
    name: decodeEntities(attribute.name),
    options: attribute.terms.map((term) => decodeEntities(term.name)),
  };
}

export function mapWooProductToProduct(raw: WooCommerceProduct): Product {
  const name = decodeEntities(raw.name);
  const images = raw.images.map((img) => mapImage(img, name));
  const [image, ...gallery] = images.length > 0 ? images : [PRODUCT_IMAGE_FALLBACK];
  const categories = raw.categories.map((c) => decodeEntities(c.name));
  const reviewCount = raw.review_count ?? 0;

  return {
    id: String(raw.id),
    slug: raw.slug,
    sku: raw.sku || "",
    name,
    type: raw.type === "variable" ? "variable" : "simple",
    permalink: raw.permalink,
    image,
    gallery: gallery.length > 0 ? gallery : undefined,
    price: formatWooPrice(raw.prices, raw.prices.regular_price),
    salePrice: raw.on_sale ? formatWooPrice(raw.prices, raw.prices.price) : undefined,
    category: categories[0] ?? "",
    primaryCategorySlug: raw.categories[0]?.slug,
    categories: categories.length > 0 ? categories : undefined,
    tags: raw.tags.length > 0 ? raw.tags.map((t) => decodeEntities(t.name)) : undefined,
    attributes: raw.attributes.length > 0 ? raw.attributes.map(mapAttribute) : undefined,
    // This catalogue currently contains no variable products; variation
    // pricing/stock isn't exposed on the list/single product payload, so
    // selectors render from `attributes` and this stays unpopulated.
    variations: undefined,
    hasOptions: raw.has_options,
    isPurchasable: raw.is_purchasable,
    shortDescription: toPlainText(raw.short_description),
    shortDescriptionHtml: raw.short_description ? sanitizeDescriptionHtml(raw.short_description) : undefined,
    description: raw.description ? toPlainText(raw.description) : undefined,
    descriptionHtml: raw.description ? sanitizeDescriptionHtml(raw.description) : undefined,
    stockStatus: mapStockStatus(raw),
    stockQuantity: raw.low_stock_remaining ?? undefined,
    stockMessage: raw.stock_availability?.text ? decodeEntities(raw.stock_availability.text) : undefined,
    reviews: reviewCount > 0 ? { count: reviewCount, averageRating: Number.parseFloat(raw.average_rating) || 0 } : undefined,
  };
}

export function mapWooCategoryToCategoryData(raw: WooCommerceCategory): ProductCategoryData {
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: decodeEntities(raw.name),
    parentId: raw.parent ? String(raw.parent) : null,
    count: raw.count,
    image: raw.image ? mapImage(raw.image, decodeEntities(raw.name)) : PRODUCT_IMAGE_FALLBACK,
    description: raw.description ? toPlainText(raw.description) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

interface WooResponse<T> {
  data: T;
  total: number;
  totalPages: number;
}

async function wooRequest<T>(route: string, params: Record<string, string | number | string[] | undefined>): Promise<WooResponse<T>> {
  const url = new URL(`${STORE_URL}/`);
  const search = new URLSearchParams();
  search.set("rest_route", `${STORE_API_PATH}${route}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(`${key}[]`, item);
    } else {
      search.set(key, String(value));
    }
  }
  url.search = search.toString();

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (error) {
    console.error("[woocommerce] network error requesting", url.toString(), error);
    throw new WooCommerceApiError();
  }

  if (!response.ok) {
    console.error("[woocommerce] non-OK response", response.status, url.toString());
    throw new WooCommerceApiError();
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch (error) {
    console.error("[woocommerce] failed to parse JSON from", url.toString(), error);
    throw new WooCommerceApiError();
  }

  const total = Number.parseInt(response.headers.get("x-wp-total") ?? "", 10);
  const totalPages = Number.parseInt(response.headers.get("x-wp-totalpages") ?? "", 10);
  const count = Array.isArray(data) ? data.length : 0;

  return {
    data,
    total: Number.isFinite(total) ? total : count,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ProductOrderBy = "date" | "price" | "rating" | "popularity" | "title" | "menu_order";
export type SortOrder = "asc" | "desc";
export type ApiStockStatus = "instock" | "outofstock" | "onbackorder";

export interface GetProductsParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** WooCommerce category term ID (not slug) — resolve via getProductCategoryBySlug first. */
  category?: string;
  orderby?: ProductOrderBy;
  order?: SortOrder;
  stockStatus?: ApiStockStatus | ApiStockStatus[];
}

export interface ProductListResult {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

const DEFAULT_PER_PAGE = 24;

/** Maps this app's `?sort=` URL values (see ProductSort) onto Store API orderby/order. */
export function resolveSort(sort: string | null | undefined): { orderby?: ProductOrderBy; order?: SortOrder } {
  switch (sort) {
    case "newest":
      return { orderby: "date", order: "desc" };
    case "price-asc":
      return { orderby: "price", order: "asc" };
    case "price-desc":
      return { orderby: "price", order: "desc" };
    case "rating":
      return { orderby: "rating", order: "desc" };
    case "popularity":
      return { orderby: "popularity", order: "desc" };
    case "name-asc":
      return { orderby: "title", order: "asc" };
    default:
      return {};
  }
}

/** Maps this app's `?stock=` URL values (see ProductFilters) onto Store API stock_status values. */
export function resolveStockStatus(values: string[]): ApiStockStatus[] | undefined {
  const mapped = values
    .map((v) => (v === "in-stock" ? "instock" : v === "backorder" ? "onbackorder" : v === "out-of-stock" ? "outofstock" : null))
    .filter((v): v is ApiStockStatus => v !== null);
  return mapped.length > 0 ? mapped : undefined;
}

/** Fetches a page of published products, optionally filtered/sorted/searched. */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? DEFAULT_PER_PAGE;

  const { data, total, totalPages } = await wooRequest<WooCommerceProduct[]>("/products", {
    page,
    per_page: perPage,
    search: params.search,
    category: params.category,
    orderby: params.orderby,
    order: params.order,
    stock_status: params.stockStatus,
  });

  return { products: data.map(mapWooProductToProduct), total, totalPages, page, perPage };
}

/** Fetches a single product by its exact slug, or null if no product matches. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await wooRequest<WooCommerceProduct[]>("/products", { slug, per_page: 1 });
  const raw = data[0];
  return raw ? mapWooProductToProduct(raw) : null;
}

/** Fetches every product category (33 total on this store), including parent/child relationships. */
export async function getProductCategories(): Promise<ProductCategoryData[]> {
  const { data } = await wooRequest<WooCommerceCategory[]>("/products/categories", {
    per_page: 100,
    orderby: "name",
    order: "asc",
  });
  return data.map(mapWooCategoryToCategoryData);
}

/** Fetches only the top-level (no parent) categories, for primary shop navigation. */
export async function getTopLevelCategories(): Promise<ProductCategoryData[]> {
  const categories = await getProductCategories();
  return categories.filter((c) => c.parentId === null);
}

export async function getProductCategoryBySlug(slug: string): Promise<ProductCategoryData | null> {
  const categories = await getProductCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/**
 * Fetches products in a category by slug. The Store API's `category` filter
 * already includes descendant subcategories when given a parent term ID
 * (verified against the live store), so parent/child relationships are
 * preserved without extra requests.
 */
export async function getProductsByCategory(
  categorySlug: string,
  params: Omit<GetProductsParams, "category"> = {}
): Promise<ProductListResult & { category: ProductCategoryData | null }> {
  const category = await getProductCategoryBySlug(categorySlug);
  if (!category) {
    return { products: [], total: 0, totalPages: 1, page: params.page ?? 1, perPage: params.perPage ?? DEFAULT_PER_PAGE, category: null };
  }
  const result = await getProducts({ ...params, category: category.id });
  return { ...result, category };
}

/** Searches products by name/content. */
export async function searchProducts(query: string, params: Omit<GetProductsParams, "search"> = {}): Promise<ProductListResult> {
  const trimmed = query.trim();
  if (!trimmed) return { products: [], total: 0, totalPages: 1, page: params.page ?? 1, perPage: params.perPage ?? DEFAULT_PER_PAGE };
  return getProducts({ ...params, search: trimmed });
}

/** Fetches WooCommerce's related products for a given product ID. */
export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  const { data } = await wooRequest<WooCommerceProduct[]>("/products", { related: productId, per_page: limit });
  return data.map(mapWooProductToProduct);
}
