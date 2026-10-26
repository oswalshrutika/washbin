"use client";

import { useState, useTransition } from "react";
import { Info } from "lucide-react";
import type { PriceOption } from "@/app/actions/booking";
import { CANCELLATION, PAYMENT, PRICING, type PaymentOption } from "@/config/business";
import { formatINR } from "@/lib/money";
import type { Quote } from "@/lib/pricing";
import { formatDay, formatDuration } from "@/lib/time";
import type { ChosenSlot } from "./step-when";

const OPTION_LABEL: Record<PaymentOption, string> = {
  full: "Pay in full now",
  advance: `Pay ${PAYMENT.advancePercent}% now, rest after the service`,
  after_service: "Pay after the service",
  cash: "Cash after the service",
};

export function StepReview({
  quote,
  options,
  slot,
  addressText,
  couponCode,
  applyCoupon,
  paymentOption,
  setPaymentOption,
  photosCount,
  instructions,
}: {
  quote: Quote | null;
  options: PriceOption[];
  slot: ChosenSlot;
  addressText: string;
  couponCode: string | null;
  applyCoupon: (code: string | null) => Promise<void>;
  paymentOption: PaymentOption;
  setPaymentOption: (o: PaymentOption) => void;
  photosCount: number;
  instructions: string;
}) {
  const [code, setCode] = useState(couponCode ?? "");
  const [pending, startTransition] = useTransition();
  if (!quote) return <p className="text-ink-soft">Working out your price…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold">Check and book</h2>

      <dl className="panel mt-4 divide-y-2 divide-grout">
        <Row term="When">
          {formatDay(slot.date)}, arriving {slot.label}. About {formatDuration(quote.durationMinutes)} with {quote.washers === 1 ? "1 washer" : `${quote.washers} washers`}.
        </Row>
        <Row term="Where">{addressText}</Row>
        {(instructions || photosCount > 0) && (
          <Row term="Notes">
            {[instructions && `“${instructions}”`, photosCount > 0 && `${photosCount} photo${photosCount > 1 ? "s" : ""}`].filter(Boolean).join(", ")}
          </Row>
        )}
      </dl>

      <h3 className="mt-6 text-lg font-bold">Price</h3>
      <table className="mt-2 w-full">
        <tbody>
          {quote.lines.map((l, i) => (
            <tr key={i}>
              <td className="py-1 pr-3">
                {l.kind === "addon" && <span className="text-ink-soft">+ </span>}
                {l.name}
                {l.qty > 1 && ` × ${l.qty}`}
              </td>
              <td className="py-1 text-right whitespace-nowrap">{formatINR(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tbody className="border-t-2 border-grout">
          {quote.visitCharge > 0 && (
            <tr>
              <td className="pt-2 pr-3 text-ink-soft">Visit charge (orders under {formatINR(PRICING.visitChargeWaivedFrom)})</td>
              <td className="pt-2 text-right">{formatINR(quote.visitCharge)}</td>
            </tr>
          )}
          {quote.discount > 0 && (
            <tr className="text-teal">
              <td className="pt-1 pr-3">Coupon {quote.couponCode}</td>
              <td className="pt-1 text-right">−{formatINR(quote.discount)}</td>
            </tr>
          )}
          <tr>
            <td className="pt-1 pr-3 text-ink-soft">GST ({PRICING.gstPercent}%)</td>
            <td className="pt-1 text-right">{formatINR(quote.tax)}</td>
          </tr>
          <tr className="font-display text-xl font-bold">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right">{formatINR(quote.total)}</td>
          </tr>
        </tbody>
      </table>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(() => applyCoupon(code.trim() || null));
        }}
      >
        <label htmlFor="coupon" className="sr-only">
          Coupon code
        </label>
        <input id="coupon" className="field flex-1 uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
        {couponCode && quote.couponCode ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setCode("");
              startTransition(() => applyCoupon(null));
            }}
          >
            Remove
          </button>
        ) : (
          <button className="btn-secondary" disabled={pending || !code.trim()}>
            Apply
          </button>
        )}
      </form>
      {quote.couponError && <p className="mt-1 text-brick">{quote.couponError}</p>}

      {quote.priceMayChangeOnSite && (
        <p className="mt-5 flex gap-2 rounded-[var(--radius-tile)] bg-marigold/15 p-3">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
          The price may change on site if the work differs from what you booked. You&apos;ll approve any change before it&apos;s added.
        </p>
      )}

      <fieldset className="mt-6">
        <legend className="text-lg font-bold">Payment</legend>
        <div className="mt-2 space-y-2">
          {options.map(({ option, dueNow }) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border-2 border-ink/15 bg-white p-4 has-checked:border-teal has-checked:bg-teal/10 has-focus-visible:outline-3 has-focus-visible:outline-teal"
            >
              <input type="radio" name="payment" className="size-5 accent-teal" checked={paymentOption === option} onChange={() => setPaymentOption(option)} />
              <span className="flex-1">
                <span className="block font-semibold">{OPTION_LABEL[option]}</span>
                <span className="block text-sm text-ink-soft">
                  {dueNow > 0
                    ? `${formatINR(dueNow)} now by UPI, card or net banking${dueNow < quote.total ? `, ${formatINR(quote.total - dueNow)} later` : ""}`
                    : "Nothing to pay now. Pay online once the job is done."}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-4 text-sm text-ink-soft">
        Free cancellation and rescheduling up to {CANCELLATION.cutoffHours} hours before your slot. After that a {formatINR(CANCELLATION.lateCancelFee)} fee applies.
      </p>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-4">
      <dt className="w-16 shrink-0 font-semibold">{term}</dt>
      <dd className="text-ink-soft">{children}</dd>
    </div>
  );
}
