import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Mukta } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BRAND } from "@/config/business";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
// Mukta covers Devanagari, so Marathi and Hindi can launch without a font change.
const mukta = Mukta({ variable: "--font-mukta", subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — ${BRAND.tagline} in Pune & PCMC`, template: `%s | ${BRAND.name}` },
  description:
    "Book verified cleaners in Pune and Pimpri-Chinchwad for deep home cleaning, kitchen, bathroom, sofa, carpet, water tank and doorstep car wash. Transparent prices.",
};

export const viewport: Viewport = { themeColor: "#12324a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${mukta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
