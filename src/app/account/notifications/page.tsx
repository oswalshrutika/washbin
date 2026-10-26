import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { markNotificationsRead } from "@/app/actions/account";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const list = await db.query.notifications.findMany({
    where: eq(notifications.userId, user.id),
    orderBy: desc(notifications.createdAt),
    limit: 50,
    with: { booking: { columns: { code: true } } },
  });
  const unread = list.some((n) => !n.readAt);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        {unread && (
          <form action={markNotificationsRead}>
            <button className="btn-quiet">Mark all as read</button>
          </form>
        )}
      </div>
      {list.length === 0 ? (
        <p className="mt-6 text-ink-soft">Booking updates and receipts will show up here, and on SMS and WhatsApp.</p>
      ) : (
        <ul className="mt-6 space-y-[5px]">
          {list.map((n) => (
            <li key={n.id} className={`rounded-[var(--radius-tile)] p-4 ${n.readAt ? "bg-white" : "bg-grout"}`}>
              <p className="font-semibold">
                {!n.readAt && <span className="sr-only">Unread: </span>}
                {n.title}
              </p>
              <p className="text-ink-soft">{n.body}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {formatDateTime(n.createdAt)}
                {n.booking && (
                  <>
                    {", "}
                    <Link href={`/account/bookings/${n.booking.code}`} className="font-semibold text-teal underline">
                      view booking
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
