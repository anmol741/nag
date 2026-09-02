export const business = {
  name: "Nag's Beauty Supplies & Training Center Ltd",
  shortName: "Nag's Beauty Supplies",
  tagline: "Wholesale Beauty Supply & Esthetic Training Center",
  address: {
    line1: "102-19623 56 Avenue",
    city: "Langley",
    region: "BC",
    postalCode: "V3A 3X7",
    full: "102-19623 56 Avenue, Langley, BC V3A 3X7",
  },
  phone: "(778) 278-7727",
  phoneHref: "tel:+17782787727",
  instagram: {
    handle: "@marjorey_b_beauty_supplies",
    url: "https://instagram.com/marjorey_b_beauty_supplies",
  },
  hours: "Storefront open 5 days a week — shop online 24/7",
  metaDescription:
    "Nag's Beauty Supplies and Training Center is a wholesale beauty supply and esthetic training center located in Langley, British Columbia.",
} as const;

export const courseCategories = [
  { slug: "skin-facial", label: "Skin & Facial" },
  { slug: "waxing-hair-removal", label: "Waxing & Hair Removal" },
  { slug: "brows-lashes", label: "Brows & Lashes" },
  { slug: "pmu", label: "PMU (Permanent Makeup)" },
  { slug: "makeup-hair", label: "Makeup & Hair" },
  { slug: "business", label: "Business" },
] as const;

export type CourseCategorySlug = (typeof courseCategories)[number]["slug"];

export function categoryLabel(slug: CourseCategorySlug): string {
  return courseCategories.find((c) => c.slug === slug)?.label ?? slug;
}

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Training Courses", href: "/courses" },
  { label: "Shop Online", href: "/shop" },
  {
    label: "Contact Us",
    href: "/contact",
    children: [
      { label: "Contact Us", href: "/contact" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
  { label: "Enroll Now", href: "/enroll" },
] as const;
