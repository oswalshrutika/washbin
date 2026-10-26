import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { pincodes, serviceAddons, services, serviceVariants, slotTemplates } from "@/db/schema";
import type { CatalogService } from "@/lib/pricing";

/** Catalog data changes only when an admin edits it, so it's cached and tagged "catalog". */

export type Service = typeof services.$inferSelect & {
  variants: CatalogService["variants"];
  addons: CatalogService["addons"];
  startingPrice: number | null;
};

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const rows = await db.query.services.findMany({
    where: eq(services.active, true),
    orderBy: asc(services.sortOrder),
    with: {
      variants: { where: eq(serviceVariants.active, true), orderBy: asc(serviceVariants.sortOrder) },
      addons: { where: eq(serviceAddons.active, true), orderBy: asc(serviceAddons.sortOrder) },
    },
  });
  return rows.map((s) => ({
    ...s,
    variants: s.variants.map(({ id, name, group, price, durationMinutes, unitLabel, maxQty }) => ({
      id,
      name,
      group,
      price,
      durationMinutes,
      unitLabel,
      maxQty,
    })),
    addons: s.addons.map(({ id, name, price, durationMinutes, maxQty }) => ({ id, name, price, durationMinutes, maxQty })),
    startingPrice: s.variants.length ? Math.min(...s.variants.map((v) => v.price)) : null,
  }));
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.slug === slug);
}

/** The pricing view of bookable (non-quote) services, safe to send to the client. */
export async function getPricingCatalog(): Promise<CatalogService[]> {
  return (await getServices())
    .filter((s) => !s.quoteOnly)
    .map(({ id, slug, name, icon, washers, priceMayChangeOnSite, variants, addons }) => ({
      id,
      slug,
      name,
      icon,
      washers,
      priceMayChangeOnSite,
      variants,
      addons,
    }));
}

export async function getSlotTemplates() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return db
    .select({
      id: slotTemplates.id,
      label: slotTemplates.label,
      startMinute: slotTemplates.startMinute,
      endMinute: slotTemplates.endMinute,
    })
    .from(slotTemplates)
    .where(eq(slotTemplates.active, true))
    .orderBy(asc(slotTemplates.startMinute));
}

export type PincodeArea = { code: string; locality: string; areaId: number; areaName: string; city: string; capacity: number };

/** Returns the served area for a pincode, or null if Washbin doesn't serve it (yet). */
export async function lookupPincode(code: string): Promise<PincodeArea | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const row = await db.query.pincodes.findFirst({ where: eq(pincodes.code, code), with: { area: true } });
  if (!row || !row.area.active) return null;
  return {
    code: row.code,
    locality: row.locality,
    areaId: row.area.id,
    areaName: row.area.name,
    city: row.area.city,
    capacity: row.area.slotCapacity,
  };
}

export async function getServedLocalities() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const rows = await db.query.pincodes.findMany({ with: { area: true }, orderBy: asc(pincodes.code) });
  return rows
    .filter((r) => r.area.active)
    .map((r) => ({ code: r.code, locality: r.locality, city: r.area.city, area: r.area.name }));
}
