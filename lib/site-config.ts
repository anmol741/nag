// Official client-confirmed social profiles. Every place that links out to
// social media reads from here (via <SocialLinks>).
export const INSTAGRAM_URL = "https://www.instagram.com/nagsbeautysupply/";
export const FACEBOOK_URL = "https://www.facebook.com/NagsBeautySupply/";
export const SOCIAL_HANDLE_DISPLAY_NAME = "@NagsBeautySupply";

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
  hours: "Storefront open 5 days a week — shop online 24/7",
  metaDescription:
    "Nag's Beauty Supplies and Training Center is a wholesale beauty supply and esthetic training center located in Langley, British Columbia.",
} as const;

/**
 * Contact details as printed in the client's signed policy PDF
 * (docs/Nags-Beauty-Website-Policies.pdf), used verbatim on the four policy
 * pages only. This address ("19623 56 Ave, Langley, BC, Canada") differs
 * from the sitewide `business.address` above ("102-19623 56 Avenue, Langley,
 * BC V3A 3X7") — unit 102 and the postal code are missing from the PDF.
 * Do not merge the two or guess which is correct; the client needs to
 * confirm whether the PDF address should gain the unit/postal code. Until
 * then this stays a separate, deliberately literal source for policy copy.
 */
export const policyContact = {
  businessName: "Nag's Beauty Supplies & Training Centre",
  address: "19623 56 Ave, Langley, BC, Canada",
  email: "info@nagsbeautysupply.com",
  emailHref: "mailto:info@nagsbeautysupply.com",
  phone: "778-278-7727",
  phoneHref: "tel:+17782787727",
  website: "www.nagsbeautysupply.com",
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
      { label: "Newsletter & Course Updates", href: "/newsletter" },
    ],
  },
  { label: "Enroll Now", href: "/enroll" },
] as const;
