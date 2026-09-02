// Product types shaped to map cleanly onto a future headless WooCommerce
// integration (WooCommerce Store API / WPGraphQL). No live data source is
// connected yet — see the integration note in `lib/woocommerce.ts`.

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
  name: string;
  image: ProductImage;
  price: string;
  salePrice?: string;
  category: string;
  shortDescription: string;
  stockStatus: StockStatus;
}

export interface ProductCategoryData {
  slug: string;
  name: string;
  image?: ProductImage;
  description?: string;
}
