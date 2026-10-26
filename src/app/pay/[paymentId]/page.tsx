import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { getPaymentForCheckout } from "@/server/bookings";
import { MockCheckout } from "./mock-checkout";

export const metadata: Metadata = { title: "Payment" };

export default function PayPage({ params }: PageProps<"/pay/[paymentId]">) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Suspense fallback={<p className="text-ink-soft">Loading payment…</p>}>
        <Checkout params={params} />
      </Suspense>
    </div>
  );
}

const PURPOSE = { full: "Full payment", advance: "Advance to confirm your booking", balance: "Balance payment" };

async function Checkout({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const user = await requireUser(`/pay/${paymentId}`);
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) notFound();
  const payment = await getPaymentForCheckout(paymentId, user.id);
  if (!payment) notFound();
  const bookingHref = `/account/bookings/${payment.booking.code}`;

  if (payment.status !== "created")
    return (
      <div>
        <h1 className="text-3xl font-extrabold">{payment.status === "captured" ? "Already paid" : "This payment didn't go through"}</h1>
        <p className="mt-2 text-ink-soft">
          {payment.status === "captured"
            ? `${formatINR(payment.amount)} was received for booking ${payment.booking.code}.`
            : "No money was taken. You can try again from your booking."}
        </p>
        <Link href={bookingHref} className="btn-primary mt-6">
          View booking
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Pay {formatINR(payment.amount)}</h1>
      <p className="mt-1 text-ink-soft">
        {PURPOSE[payment.purpose]}, booking {payment.booking.code}
      </p>
      <MockCheckout paymentId={payment.id} amount={payment.amount} />
      <p className="mt-6 text-sm">
        <Link href={bookingHref} className="btn-quiet">
          Pay later from My Bookings
        </Link>
      </p>
    </div>
  );
}
