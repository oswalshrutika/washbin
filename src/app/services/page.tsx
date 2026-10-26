import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { getServices } from "@/lib/catalog";
import { ServiceBrowser } from "./service-browser";

export const metadata: Metadata = {
  title: "Cleaning services in Pune",
  description: "Deep home cleaning, kitchen, bathroom, sofa, carpet, water tank and car wash services in Pune and PCMC.",
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageTitle title="Services" lead="Every service comes with verified washers, their own equipment and a price you see before you book." />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ServiceBrowser
          services={services.map((s) => ({
            slug: s.slug,
            name: s.name,
            icon: s.icon,
            tagline: s.tagline,
            quoteOnly: s.quoteOnly,
            startingPrice: s.startingPrice,
            shortestMinutes: s.variants.length ? Math.min(...s.variants.map((v) => v.durationMinutes)) : null,
          }))}
        />
      </div>
    </>
  );
}
