import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { channelSenders, type Channel } from "@/lib/providers/notify";

/** Sends a customer alert on every channel we can reach them on, and records it for the in-portal inbox. */
export async function notify(args: { userId: string; bookingId?: number; event: string; title: string; body: string }) {
  const user = await db.query.users.findFirst({ where: eq(users.id, args.userId) });
  if (!user) return;
  const sent: Channel[] = ["in_app"];
  for (const sender of channelSenders) {
    try {
      if (await sender.send({ to: { phone: user.phone, email: user.email }, title: args.title, body: args.body }))
        sent.push(sender.channel);
    } catch (err) {
      // A failed SMS/WhatsApp must never fail the booking action that triggered it.
      console.error(`[notify] ${sender.channel} failed`, err);
    }
  }
  await db.insert(notifications).values({ ...args, channels: sent });
}
