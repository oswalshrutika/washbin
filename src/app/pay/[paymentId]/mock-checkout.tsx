"use client";

import { useState, useTransition } from "react";
import { Building2, CreditCard, Smartphone, Wallet } from "lucide-react";
import { completeMockPayment } from "@/app/actions/payments";
import { formatINR } from "@/lib/money";

const METHODS = [
  { value: "upi", label: "UPI", Icon: Smartphone },
  { value: "card", label: "Card", Icon: CreditCard },
  { value: "netbanking", label: "Net banking", Icon: Building2 },
  { value: "wallet", label: "Wallet", Icon: Wallet },
];

/** Stand-in for the Razorpay checkout until the real keys are added. */
export function MockCheckout({ paymentId, amount }: { paymentId: string; amount: number }) {
  const [method, setMethod] = useState("upi");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function finish(outcome: "success" | "failure") {
    setError(null);
    startTransition(async () => {
      const res = await completeMockPayment(paymentId, outcome, method);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="panel mt-6 p-5">
      <p className="mb-4 rounded-[var(--radius-tile)] bg-marigold/20 px-3 py-2 text-sm">Test checkout. No money is charged.</p>
      <fieldset>
        <legend className="label">Pay with</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(({ value, label, Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-field)] border-2 border-ink/15 p-3 font-semibold has-checked:border-teal has-checked:bg-teal/10 has-focus-visible:outline-3 has-focus-visible:outline-teal"
            >
              <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="sr-only" />
              <Icon className="size-5 text-teal" aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-4 text-brick">
          {error}
        </p>
      )}
      <button type="button" className="btn-primary mt-5 w-full" disabled={pending} onClick={() => finish("success")}>
        {pending ? "Processing…" : `Pay ${formatINR(amount)}`}
      </button>
      <button type="button" className="btn-quiet mt-3 w-full justify-center text-brick" disabled={pending} onClick={() => finish("failure")}>
        Simulate a failed payment
      </button>
    </div>
  );
}
