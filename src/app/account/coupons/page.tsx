import type { Metadata } from "next";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { couponRedemptions, coupons } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const user = await requireUser("/account/coupons");
  const [list, used] = await Promise.all([
    db.query.coupons.findMany({
      where: and(eq(coupons.public, true), eq(coupons.active, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, sql`now()`))),
    }),
    db.select({ code: couponRedemptions.code }).from(couponRedemptions).where(eq(couponRedemptions.userId, user.id)),
  ]);
  const usedCount = (code: string) => used.filter((u) => u.code === code).length;

  return (
    <>
      <h1 className="text-3xl font-extrabold">Coupons</h1>
      <p className="mt-1 text-ink-soft">Enter a code on the review step when you book.</p>
      {list.length === 0 ? (
        <p className="mt-6">No offers right now. Check back soon.</p>
      ) : (
        <ul className="mt-6 grid gap-[5px] sm:grid-cols-2">
          {list.map((c) => {
            const usedUp = usedCount(c.code) >= c.perUserLimit;
            return (
              <li key={c.code} className={`rounded-[var(--radius-tile)] p-4 ${usedUp ? "bg-grout/60 text-ink-soft" : "bg-marigold/20"}`}>
                <p className="font-display text-xl font-extrabold tracking-wide">{c.code}</p>
                <p className="mt-1">{c.description}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {[
                    c.minOrder > 0 && `On orders of ${formatINR(c.minOrder)} or more.`,
                    c.firstBookingOnly && "First booking only.",
                    c.expiresAt && `Valid till ${formatDateTime(c.expiresAt)}.`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                {usedUp && <p className="mt-2 text-sm font-semibold">You&apos;ve used this code.</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
