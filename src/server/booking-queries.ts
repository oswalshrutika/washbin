import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookingEvents, bookings, payments, refunds, services } from "@/db/schema";

/** Everything the customer's booking pages show. Returns undefined if the booking isn't theirs. */
export async function getCustomerBooking(code: string, userId: string) {
  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.code, code), eq(bookings.userId, userId)),
    with: {
      items: true,
      slot: true,
      area: true,
      photos: true,
      events: { orderBy: asc(bookingEvents.createdAt) },
      payments: { orderBy: desc(payments.createdAt) },
      refunds: { orderBy: desc(refunds.createdAt) },
    },
  });
  if (!booking) return undefined;
  const serviceIds = [...new Set(booking.items.map((i) => i.serviceId))];
  const serviceRows = await db
    .select({ id: services.id, name: services.name, slug: services.slug, icon: services.icon, customerProvides: services.customerProvides })
    .from(services)
    .where(inArray(services.id, serviceIds));
  return { ...booking, services: serviceRows };
}

export type CustomerBooking = NonNullable<Awaited<ReturnType<typeof getCustomerBooking>>>;

export async function listCustomerBookings(userId: string) {
  return db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
    orderBy: [desc(bookings.date), desc(bookings.createdAt)],
    with: { items: { columns: { name: true, kind: true } }, slot: { columns: { label: true, startMinute: true } } },
  });
}
