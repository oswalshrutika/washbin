/**
 * Loads the placeholder catalog, areas, slots and coupons from seed-data.ts.
 * Idempotent: skips any table that already has rows. Run `npm run db:reset` for a clean slate.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { AREAS, COUPONS, SERVICES, SLOTS } from "./seed-data";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db.transaction(async (tx) => {
    if ((await tx.select().from(schema.services).limit(1)).length === 0) {
      for (const [i, s] of SERVICES.entries()) {
        const { variants, addons, ...service } = s;
        const [row] = await tx
          .insert(schema.services)
          .values({ ...service, sortOrder: i })
          .returning({ id: schema.services.id });
        if (variants.length)
          await tx
            .insert(schema.serviceVariants)
            .values(variants.map((v, j) => ({ ...v, serviceId: row.id, sortOrder: j })));
        if (addons.length)
          await tx
            .insert(schema.serviceAddons)
            .values(addons.map((a, j) => ({ ...a, serviceId: row.id, sortOrder: j })));
      }
      console.log(`Seeded ${SERVICES.length} services`);
    }

    if ((await tx.select().from(schema.serviceAreas).limit(1)).length === 0) {
      for (const a of AREAS) {
        const [row] = await tx
          .insert(schema.serviceAreas)
          .values({ name: a.name, city: a.city, slotCapacity: a.slotCapacity })
          .returning({ id: schema.serviceAreas.id });
        await tx
          .insert(schema.pincodes)
          .values(a.pincodes.map(([code, locality]) => ({ code, locality, areaId: row.id })));
      }
      console.log(`Seeded ${AREAS.length} areas`);
    }

    if ((await tx.select().from(schema.slotTemplates).limit(1)).length === 0) {
      await tx.insert(schema.slotTemplates).values(SLOTS);
      console.log(`Seeded ${SLOTS.length} slots`);
    }

    if ((await tx.select().from(schema.coupons).limit(1)).length === 0) {
      await tx.insert(schema.coupons).values(COUPONS);
      console.log(`Seeded ${COUPONS.length} coupons`);
    }
  });

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
