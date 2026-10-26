import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND, INVOICE, PRICING } from "@/config/business";
import { formatAddress } from "@/lib/address";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { formatDateTime, formatLongDay } from "@/lib/time";
import { getCustomerBooking } from "@/server/booking-queries";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: PageProps<"/account/bookings/[code]/invoice">) {
  const { code } = await params;
  const user = await requireUser(`/account/bookings/${code}/invoice`);
  const booking = await getCustomerBooking(code, user.id);
  if (!booking || booking.amountPaid === 0) notFound();

  const taxable = booking.total - booking.tax;
  const cgst = Math.floor(booking.tax / 2);
  const sgst = booking.tax - cgst;
  const captured = booking.payments.filter((p) => p.status === "captured");
  const issuedAt = captured.at(-1)?.updatedAt ?? booking.createdAt;
  const half = PRICING.gstPercent / 2;

  return (
    <article className="panel p-6 print:border-0 print:p-0 print:shadow-none">
      <div className="mb-6 flex justify-between gap-3 print:hidden">
        <Link href={`/account/bookings/${booking.code}`} className="btn-quiet">
          Back to booking
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-wrap justify-between gap-4 border-b-2 border-grout pb-4">
        <div>
          <h1 className="text-2xl font-extrabold">Tax invoice</h1>
          <p className="text-ink-soft">
            {BRAND.name}, operated by {INVOICE.legalName}
            <br />
            {INVOICE.address}
            <br />
            GSTIN {INVOICE.gstin}
          </p>
        </div>
        <dl className="text-right text-[0.95rem]">
          <dt className="text-ink-soft">Invoice no.</dt>
          <dd className="font-semibold">INV-{booking.code.slice(3)}</dd>
          <dt className="mt-1 text-ink-soft">Issued</dt>
          <dd>{formatDateTime(issuedAt)}</dd>
        </dl>
      </header>

      <section className="grid gap-4 border-b-2 border-grout py-4 sm:grid-cols-2">
        <div>
          <h2 className="font-bold">Billed to</h2>
          <p>{user.name ?? `+${user.phone}`}</p>
          <p className="text-ink-soft">{formatAddress(booking.address)}</p>
        </div>
        <div>
          <h2 className="font-bold">Service</h2>
          <p>Booking {booking.code}</p>
          <p className="text-ink-soft">
            {formatLongDay(booking.date)}, {booking.slot.label}
            <br />
            Place of supply: Maharashtra ({INVOICE.stateCode})
          </p>
        </div>
      </section>

      <table className="mt-4 w-full text-[0.95rem]">
        <thead>
          <tr className="border-b-2 border-grout text-left text-ink-soft">
            <th className="py-1.5 font-semibold">Description</th>
            <th className="py-1.5 font-semibold">SAC</th>
            <th className="py-1.5 text-right font-semibold">Qty</th>
            <th className="py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {booking.items.map((i) => (
            <tr key={i.id} className="border-b border-grout/70">
              <td className="py-1.5">{i.name}</td>
              <td className="py-1.5">{INVOICE.sac}</td>
              <td className="py-1.5 text-right">{i.qty}</td>
              <td className="py-1.5 text-right">{formatINR(i.unitPrice * i.qty)}</td>
            </tr>
          ))}
          {booking.visitCharge > 0 && <Row label="Visit charge" amount={booking.visitCharge} />}
          {booking.discount > 0 && <Row label={`Discount (${booking.couponCode})`} amount={-booking.discount} />}
          <Row label="Taxable value" amount={taxable} strong />
          <Row label={`CGST @ ${half}%`} amount={cgst} />
          <Row label={`SGST @ ${half}%`} amount={sgst} />
          <Row label="Invoice total" amount={booking.total} strong />
          <Row label="Paid" amount={booking.amountPaid} />
          {booking.total > booking.amountPaid && <Row label="Balance due" amount={booking.total - booking.amountPaid} strong />}
        </tbody>
      </table>

      {captured.length > 0 && (
        <section className="mt-6">
          <h2 className="font-bold">Payments</h2>
          <ul className="text-[0.95rem] text-ink-soft">
            {captured.map((p) => (
              <li key={p.id}>
                {formatINR(p.amount)} by {p.method?.toUpperCase()} on {formatDateTime(p.updatedAt)}, ref {p.providerPaymentId}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 text-sm text-ink-soft">This is a computer-generated invoice and does not need a signature.</p>
    </article>
  );
}

function Row({ label, amount, strong }: { label: string; amount: number; strong?: boolean }) {
  return (
    <tr className={strong ? "font-bold" : "text-ink-soft"}>
      <td className="py-1" colSpan={3}>
        {label}
      </td>
      <td className="py-1 text-right">{amount < 0 ? `−${formatINR(-amount)}` : formatINR(amount)}</td>
    </tr>
  );
}
