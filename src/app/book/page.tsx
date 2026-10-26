import type { Metadata } from "next";
import { Suspense } from "react";
import { getPricingCatalog } from "@/lib/catalog";
import { BookingWizard } from "./wizard";

export const metadata: Metadata = { title: "Book a cleaning" };

export default async function BookPage() {
  const catalog = await getPricingCatalog();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="sr-only">Book a cleaning</h1>
      <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
        <BookingWizard catalog={catalog} />
      </Suspense>
    </div>
  );
}
