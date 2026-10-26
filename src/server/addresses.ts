import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { lookupPincode } from "@/lib/catalog";

export const addressInput = z.object({
  label: z.enum(["home", "office", "other"]),
  flat: z.string().trim().min(1, "Enter your flat or house number").max(60),
  wing: z.string().trim().max(40).optional().transform((v) => v || null),
  society: z.string().trim().min(2, "Enter your society or building name").max(120),
  street: z.string().trim().max(160).optional().transform((v) => v || null),
  landmark: z.string().trim().max(120).optional().transform((v) => v || null),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  lat: z.number().min(-90).max(90).nullable().optional().transform((v) => v ?? null),
  lng: z.number().min(-180).max(180).nullable().optional().transform((v) => v ?? null),
});
export type AddressInput = z.input<typeof addressInput>;

export type SavedAddress = typeof addresses.$inferSelect & { locality: string | null; served: boolean };

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  const rows = await db.query.addresses.findMany({
    where: and(eq(addresses.userId, userId), isNull(addresses.deletedAt)),
    orderBy: desc(addresses.createdAt),
  });
  return Promise.all(
    rows.map(async (a) => {
      const area = await lookupPincode(a.pincode);
      return { ...a, locality: area?.locality ?? null, served: !!area };
    }),
  );
}

export class AddressError extends Error {}

function parse(input: AddressInput) {
  const parsed = addressInput.safeParse(input);
  if (!parsed.success) throw new AddressError(parsed.error.issues[0]?.message ?? "Please check the address");
  return parsed.data;
}

export async function createAddress(userId: string, input: AddressInput) {
  const data = parse(input);
  if (!(await lookupPincode(data.pincode))) throw new AddressError("Washbin isn't available at this pincode yet");
  const [row] = await db.insert(addresses).values({ ...data, userId }).returning();
  return row;
}

export async function updateAddress(userId: string, id: number, input: AddressInput) {
  const data = parse(input);
  if (!(await lookupPincode(data.pincode))) throw new AddressError("Washbin isn't available at this pincode yet");
  const [row] = await db
    .update(addresses)
    .set(data)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId), isNull(addresses.deletedAt)))
    .returning();
  if (!row) throw new AddressError("Address not found");
  return row;
}

/** Soft delete: past bookings keep their own address snapshot. */
export async function deleteAddress(userId: string, id: number) {
  await db
    .update(addresses)
    .set({ deletedAt: new Date() })
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}
