import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatAddress } from "@/lib/address";
import { requireUser } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/booking-rules";
import { formatINR } from "@/lib/money";
import { formatLongDay } from "@/lib/time";
import { getCustomerBooking } from "@/server/booking-queries";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function ConfirmedPage({ params }: PageProps<"/book/confirmed/[code]">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Suspense fallback={<p className="text-ink-soft">Loading your booking…</p>}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/book/confirmed/${code}`);
  const booking = await getCustomerBooking(code, user.id);
  if (!booking) notFound();
  const confirmed = booking.status !== "payment_pending" && booking.status !== "cancelled";
  const keepReady = [...new Set(booking.services.flatMap((s) => s.customerProvides))];
  const balance = booking.total - booking.amountPaid;

  return (
    <div>
      {confirmed ? (
        <div className="tile-in rounded-[10px] bg-teal p-6 text-white">
          <CheckCircle2 className="size-10" aria-hidden />
          <h1 className="mt-3 text-4xl font-extrabold">Booking confirmed</h1>
          <p className="mt-1 text-lg text-white/85">We&apos;re assigning your washer. You&apos;ll get their name and photo by SMS and WhatsApp.</p>
        </div>
      ) : (
        <div className="rounded-[10px] bg-marigold/25 p-6">
          <h1 className="text-3xl font-extrabold">{STATUS_LABEL[booking.status]}</h1>
          <p className="mt-1">This booking isn&apos;t confirmed yet. Open it to finish payment.</p>
        </div>
      )}

      <dl className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-[9rem_1fr]">
        <dt className="font-semibold">Booking ID</dt>
        <dd className="font-display text-2xl font-bold tracking-wide">{booking.code}</dd>
        <dt className="font-semibold">Services</dt>
        <dd>
          {booking.items.map((i) => (
            <span key={i.id} className="block">
              {i.kind === "addon" && "+ "}
              {i.name}
              {i.qty > 1 && ` × ${i.qty}`}
            </span>
          ))}
        </dd>
        <dt className="font-semibold">When</dt>
        <dd>
          {formatLongDay(booking.date)}, arriving {booking.slot.label}
        </dd>
        <dt className="font-semibold">Where</dt>
        <dd>{formatAddress(booking.address)}</dd>
        <dt className="font-semibold">Price</dt>
        <dd>
          {formatINR(booking.total)} total
          {booking.amountPaid > 0 && `, ${formatINR(booking.amountPaid)} paid`}
          {balance > 0 && `, ${formatINR(balance)} after the service`}
        </dd>
      </dl>

      {keepReady.length > 0 && (
        <section className="panel mt-8 p-5">
          <h2 className="text-xl font-bold">Please keep ready</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            {keepReady.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">When the washer arrives, share the arrival OTP from your booking page so they can start.</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/account/bookings/${booking.code}`} className="btn-primary">
          View booking
        </Link>
        <Link href="/services" className="btn-secondary">
          Book something else
        </Link>
      </div>
    </div>
  );
}
