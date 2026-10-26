import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { isUpcoming } from "@/lib/booking-rules";
import { formatINR } from "@/lib/money";
import { formatDay } from "@/lib/time";
import { listCustomerBookings } from "@/server/booking-queries";

export const metadata: Metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const user = await requireUser("/account/bookings");
  const all = await listCustomerBookings(user.id);
  const groups = [
    // Soonest first for upcoming; the query returns newest first.
    { title: "Upcoming", items: all.filter((b) => isUpcoming(b.status)).reverse() },
    { title: "Past", items: all.filter((b) => b.status === "completed" || b.status === "rated") },
    { title: "Cancelled", items: all.filter((b) => b.status === "cancelled") },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{user.name ? `Hi ${user.name.split(" ")[0]}` : "My bookings"}</h1>
      {all.length === 0 ? (
        <div className="mt-6">
          <p className="text-lg">You haven&apos;t booked anything yet.</p>
          <Link href="/services" className="btn-primary mt-4">
            Choose a service
          </Link>
        </div>
      ) : (
        groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.title} className="mt-8">
                <h2 className="mb-3 text-xl font-bold">{g.title}</h2>
                <ul className="space-y-[5px] rounded-[10px] bg-grout p-[5px]">
                  {g.items.map((b) => (
                    <li key={b.id}>
                      <Link href={`/account/bookings/${b.code}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-tile)] bg-white p-4 hover:bg-soap">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {b.items
                              .filter((i) => i.kind === "variant")
                              .map((i) => i.name)
                              .join(", ")}
                          </span>
                          <span className="block text-sm text-ink-soft">
                            {formatDay(b.date)}, {b.slot.label}. {b.code}
                          </span>
                        </span>
                        <span className="text-right">
                          <StatusBadge status={b.status} />
                          <span className="block text-sm text-ink-soft">{formatINR(b.total)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )
      )}
    </div>
  );
}
