// TEMPORARY FALLBACK CATEGORY CONFIGURATION
// ------------------------------------------
// These are the real top-level WooCommerce product categories from the live
// WordPress store (https://nagsbeautysupply.com/), used here only so the
// Next.js shop navigation matches the actual store structure ahead of the
// WooCommerce API integration. There is no product count, stock, or price
// data attached — those must come from WooCommerce once connected.
//
// TODO(WooCommerce integration): replace this entire file with categories
// fetched live from the WooCommerce Store API / WPGraphQL (including their
// real product counts, images, and descriptions). Do not hand-edit this list
// to add product counts — counts must never be hard-coded.

import type { ProductImage } from "./product";

export interface ShopCategoryFallback {
  slug: string;
  name: string;
  /** Optional real business photo representative of the category. Omitted where no accurate photo exists yet — never a stock/AI image. */
  image?: ProductImage;
}

export const shopCategoriesFallback: ShopCategoryFallback[] = [
  {
    slug: "facial-skincare",
    name: "Facial & Skincare",
    image: {
      src: "/IMG-20260829-WA0044.jpg.jpeg",
      alt: "Microdermabrasion wand being used on a client's cheek",
      width: 1254,
      height: 1254,
    },
  },
  {
    slug: "jane-iredale",
    name: "Jane Iredale",
    image: {
      src: "/IMG-20260829-WA0040.jpg.jpeg",
      alt: "Client applying makeup with a brush while holding a compact mirror",
      width: 1254,
      height: 1254,
    },
  },
  {
    slug: "lash-brow",
    name: "Lash & Brow",
    image: {
      src: "/IMG-20260829-WA0038.jpg.jpeg",
      alt: "Eyelash extensions being applied with tweezers under the eye",
      width: 1254,
      height: 1254,
    },
  },
  {
    slug: "mani-pedi",
    name: "Mani & Pedi",
    // No verified manicure/pedicure product photo available yet.
  },
  {
    slug: "microneedling-devices",
    name: "Microneedling & Devices",
    image: {
      src: "/IMG-20260829-WA0030.jpg.jpeg",
      alt: "Microneedling pen device being used on a client's forehead",
      width: 1254,
      height: 1254,
    },
  },
  {
    slug: "body-massage-products",
    name: "Body & Massage Products",
    // No verified body/massage product photo available yet.
  },
  {
    slug: "masques",
    name: "Masques",
    // No verified masque/mask product photo available yet.
  },
  {
    slug: "waxing",
    name: "Waxing",
    image: {
      src: "/IMG-20260829-WA0041.jpg.jpeg",
      alt: "Esthetician applying strip wax to a client's leg during a waxing treatment",
      width: 1254,
      height: 1254,
    },
  },
];
