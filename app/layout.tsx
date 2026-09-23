import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { business } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${business.shortName} | ${business.tagline}`,
    template: `%s | ${business.shortName}`,
  },
  description: business.metaDescription,
};

// Deliberately NOT reading the session here. Most pages under this layout
// (home, shop, product pages, etc.) are statically generated and can be
// served from a CDN cache to many different visitors — baking one
// visitor's session state into that shared HTML would leak it to whoever
// else the cached page is served to next, and would also force every page
// on the site into per-request rendering just to show an account icon.
// Header instead resolves its own logged-in state client-side, after
// mount, via GET /api/auth/session (see that route and Header's comment).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
