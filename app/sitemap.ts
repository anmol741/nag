import type { MetadataRoute } from "next";
import { courses } from "@/lib/courses";
import { productCategories } from "@/lib/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const categoryRoutes = productCategories.map((category) => ({
    url: `${siteUrl}/shop/category/${category.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...courseRoutes, ...categoryRoutes];
}
