import type { MetadataRoute } from "next";
import { courses } from "@/lib/courses";
import { getProductCategories } from "@/lib/woocommerce";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/courses",
    "/shop",
    "/contact",
    "/enroll",
    "/newsletter",
    "/search",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const courseRoutes = courses.map((course) => ({
    url: `${siteUrl}/courses/${course.slug}`,
    lastModified: new Date(),
  }));

  // Falls back to just the static/course routes if WooCommerce is
  // unreachable when the sitemap is generated, rather than failing the
  // whole route.
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getProductCategories();
    categoryRoutes = categories.map((category) => ({
      url: `${siteUrl}/shop/category/${category.slug}`,
      lastModified: new Date(),
    }));
  } catch {
    categoryRoutes = [];
  }

  return [...staticRoutes, ...courseRoutes, ...categoryRoutes];
}
