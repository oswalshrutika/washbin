import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingPhotos } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readUpload } from "@/server/uploads";

/** Booking photos are private: only the customer who owns the booking can load them. */
export async function GET(_: Request, { params }: RouteContext<"/account/photos/[id]">) {
  const id = Number((await params).id);
  const user = await getCurrentUser();
  if (!user || !Number.isInteger(id)) return new Response("Not found", { status: 404 });
  const photo = await db.query.bookingPhotos.findFirst({ where: eq(bookingPhotos.id, id), with: { booking: { columns: { userId: true } } } });
  if (!photo || photo.booking.userId !== user.id) return new Response("Not found", { status: 404 });
  const { data, type } = await readUpload(photo.path);
  return new Response(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
}
