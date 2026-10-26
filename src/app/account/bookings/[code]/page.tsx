import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle, Phone } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { SUPPORT } from "@/config/business";
import { formatAddress } from "@/lib/address";
import { requireUser } from "@/lib/auth";
import { cancellationTerms, canReschedule, STATUS_FLOW } from "@/lib/booking-rules";
import { formatINR } from "@/lib/money";
import { formatDateTime, formatLongDay } from "@/lib/time";
import { getCustomerBooking, type CustomerBooking } from "@/server/booking-queries";
import { BookingActions, PayButton } from "./booking-actions";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: PageProps<"/account/bookings/[code]">) {
  const { code } = await params;
  const { payment } = await searchParams;
  const user = await requireUser(`/account/bookings/${code}`);
  const booking = await getCustomerBooking(code, user.id);
  if (!booking) notFound();

  const timing = { date: booking.date, slotStartMinute: booking.slot.startMinute, status: booking.status };
  const reschedule = canReschedule(timing);
  const cancelTerms = cancellationTerms({ ...timing, amountPaid: booking.amountPaid });
  const balance = booking.total - booking.amountPaid;
  const pending = booking.status === "payment_pending";

  return (
    <article>
      <Link href="/account/bookings" className="btn-quiet print:hidden">
        All bookings
      </Link>
      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            {booking.services.map((s) => s.name).join(" and ")}
          </h1>
          <p className="mt-1 text-ink-soft">
            Booking {booking.code}, made {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </header>

      {payment === "failed" && pending && (
        <p role="alert" className="mt-5 rounded-[var(--radius-tile)] bg-brick/10 p-4 text-brick">
          Your payment didn&apos;t go through and no money was taken. Retry within a few minutes to keep this slot.
        </p>
      )}
      {payment === "done" && <p className="mt-5 rounded-[var(--radius-tile)] bg-teal/10 p-4 font-semibold text-teal">Payment received. Thank you.</p>}

      <Timeline booking={booking} />

      <div className="mt-8 grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold">When and where</h2>
            <p className="mt-1">
              {formatLongDay(booking.date)}, arriving {booking.slot.label}
            </p>
            <p className="text-ink-soft">{formatAddress(booking.address)}</p>
            {booking.instructions && <p className="mt-2 text-ink-soft">Your note: &ldquo;{booking.instructions}&rdquo;</p>}
            {booking.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {booking.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image
                  <img key={p.id} src={`/account/photos/${p.id}`} alt="Photo you added" className="size-20 rounded-[var(--radius-tile)] object-cover" />
                ))}
              </div>
            )}
          </section>

          {!pending && booking.status !== "cancelled" && (
            <section className="panel p-4">
              <h2 className="font-bold">Arrival OTP</h2>
              <p className="text-ink-soft">You&apos;ll see a 4-digit code here once a washer is assigned. Share it when they arrive so they can start.</p>
            </section>
          )}

          <BookingActions
            code={booking.code}
            reschedule={reschedule.ok ? { ok: true } : { ok: false, reason: reschedule.reason }}
            cancel={cancelTerms}
            current={{ date: booking.date, slotId: booking.slotId, label: booking.slot.label }}
          />
        </div>

        <aside className="space-y-6">
          <section>
            <h2 className="text-xl font-bold">Price</h2>
            <table className="mt-2 w-full text-[0.98rem]">
              <tbody>
                {booking.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-0.5 pr-2">
                      {i.kind === "addon" && "+ "}
                      {i.name}
                      {i.qty > 1 && ` × ${i.qty}`}
                    </td>
                    <td className="py-0.5 text-right">{formatINR(i.unitPrice * i.qty)}</td>
                  </tr>
                ))}
                {booking.visitCharge > 0 && <Line label="Visit charge" amount={booking.visitCharge} />}
                {booking.discount > 0 && <Line label={`Coupon ${booking.couponCode}`} amount={-booking.discount} />}
                <Line label="GST" amount={booking.tax} />
                <tr className="border-t-2 border-grout font-bold">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right">{formatINR(booking.total)}</td>
                </tr>
                <Line label="Paid" amount={booking.amountPaid} />
                {booking.refunds.map((r) => (
                  <Line key={r.id} label={`Refund (${r.status})`} amount={-r.amount} />
                ))}
              </tbody>
            </table>
            {booking.status !== "cancelled" && balance > 0 && (
              <div className="mt-4">
                <PayButton code={booking.code} label={pending ? `Retry payment, ${formatINR(booking.dueNow - booking.amountPaid)}` : `Pay balance, ${formatINR(balance)}`} />
                {!pending && booking.paymentOption !== "full" && <p className="mt-1 text-sm text-ink-soft">You can also pay after the service.</p>}
              </div>
            )}
            {booking.amountPaid > 0 && (
              <Link href={`/account/bookings/${booking.code}/invoice`} className="btn-quiet mt-3">
                Download invoice
              </Link>
            )}
          </section>

          <section className="print:hidden">
            <h2 className="text-xl font-bold">Need help?</h2>
            <ul className="mt-2 space-y-2">
              <li>
                <a href={`tel:${SUPPORT.phone.replaceAll(" ", "")}`} className="btn-quiet">
                  <Phone className="size-4" aria-hidden /> Call support
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${SUPPORT.whatsapp}?text=${encodeURIComponent(`Hi, I need help with booking ${booking.code}`)}`}
                  className="btn-quiet"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp us about this booking
                </a>
              </li>
            </ul>
          </section>

          <Link href={`/book?again=${booking.code}`} className="btn-secondary w-full print:hidden">
            Book again
          </Link>
        </aside>
      </div>
    </article>
  );
}

function Line({ label, amount }: { label: string; amount: number }) {
  return (
    <tr className="text-ink-soft">
      <td className="py-0.5 pr-2">{label}</td>
      <td className="py-0.5 text-right">{amount < 0 ? `−${formatINR(-amount)}` : formatINR(amount)}</td>
    </tr>
  );
}

function Timeline({ booking }: { booking: CustomerBooking }) {
  if (booking.status === "cancelled") {
    const event = booking.events.findLast((e) => e.type === "cancelled");
    return (
      <section className="mt-6 rounded-[var(--radius-tile)] bg-brick/10 p-4">
        <h2 className="font-bold text-brick">Cancelled {booking.cancelledAt && formatDateTime(booking.cancelledAt)}</h2>
        {event?.note && <p className="mt-1">{event.note}.</p>}
      </section>
    );
  }
  const reached = STATUS_FLOW.findIndex((s) => s.status === booking.status);
  return (
    <section className="mt-6" aria-label="Booking progress">
      <ol className="grid grid-cols-4 gap-[5px] sm:grid-cols-8">
        {STATUS_FLOW.map((s, i) => {
          const at = booking.events.findLast((e) => e.type === s.status)?.createdAt;
          const done = i <= reached;
          return (
            <li key={s.status} className={`rounded-[var(--radius-tile)] p-2.5 ${done ? (i === reached ? "bg-teal text-white" : "bg-teal/15") : "bg-grout/60 text-ink-soft"}`}>
              <span className="flex items-center gap-1 text-sm font-semibold">
                {done && i < reached && <Check className="size-4" aria-hidden />}
                {s.label}
              </span>
              {at && done && <span className="block text-xs opacity-80">{formatDateTime(at)}</span>}
              <span className="sr-only">{done ? (i === reached ? "(current)" : "(done)") : "(next)"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
