"use client";

import { useCallback, useState, useTransition } from "react";
import { cancel, getRescheduleSlots, reschedule as rescheduleAction } from "@/app/actions/account";
import { payForBooking } from "@/app/actions/payments";
import { SlotPicker, type ChosenSlot } from "@/components/slot-picker";
import { formatINR } from "@/lib/money";

type CancelTerms = { ok: true; fee: number; refund: number; late: boolean } | { ok: false; reason: string };

const REASONS = ["My plans changed", "Booked by mistake", "Found another service", "The price is too high", "Other"];

export function BookingActions({
  code,
  reschedule,
  cancel: terms,
  current,
}: {
  code: string;
  reschedule: { ok: true } | { ok: false; reason: string };
  cancel: CancelTerms;
  current: ChosenSlot;
}) {
  const [open, setOpen] = useState<"reschedule" | "cancel" | null>(null);
  if (!reschedule.ok && !terms.ok) return null;

  return (
    <section className="print:hidden">
      <div className="flex flex-wrap gap-3">
        {reschedule.ok && (
          <button type="button" className="btn-secondary" aria-expanded={open === "reschedule"} onClick={() => setOpen(open === "reschedule" ? null : "reschedule")}>
            Reschedule
          </button>
        )}
        {terms.ok && (
          <button type="button" className="btn-secondary text-brick" aria-expanded={open === "cancel"} onClick={() => setOpen(open === "cancel" ? null : "cancel")}>
            Cancel booking
          </button>
        )}
      </div>
      {!reschedule.ok && terms.ok && <p className="mt-2 text-sm text-ink-soft">{reschedule.reason}</p>}
      {open === "reschedule" && <Reschedule code={code} current={current} onDone={() => setOpen(null)} />}
      {open === "cancel" && terms.ok && <Cancel code={code} terms={terms} />}
    </section>
  );
}

function Reschedule({ code, current, onDone }: { code: string; current: ChosenSlot; onDone: () => void }) {
  const [chosen, setChosen] = useState<ChosenSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loadSlots = useCallback((date: string) => getRescheduleSlots(code, date), [code]);
  const unchanged = chosen?.date === current.date && chosen.slotId === current.slotId;

  return (
    <div className="panel mt-4 p-4">
      <h3 className="mb-4 text-lg font-bold">Pick a new time</h3>
      <SlotPicker loadSlots={loadSlots} chosen={chosen} onChange={setChosen} />
      {error && (
        <p role="alert" className="mt-3 text-brick">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-primary mt-4"
        disabled={!chosen || unchanged || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await rescheduleAction(code, chosen!.date, chosen!.slotId);
            if (res.ok) onDone();
            else setError(res.error);
          })
        }
      >
        {pending ? "Moving…" : "Move booking"}
      </button>
    </div>
  );
}

function Cancel({ code, terms }: { code: string; terms: { fee: number; refund: number; late: boolean } }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="panel mt-4 p-4">
      <h3 className="text-lg font-bold">Cancel this booking?</h3>
      <p className="mt-1">
        {terms.late
          ? `It's less than the free-cancellation window before your slot, so a ${formatINR(terms.fee)} fee applies.`
          : "You're within the free-cancellation window."}{" "}
        {terms.refund > 0 ? `${formatINR(terms.refund)} will be refunded to your original payment method in 5–7 working days.` : "Nothing to refund."}
      </p>
      <label className="label mt-4" htmlFor="cancel-reason">
        Reason
      </label>
      <select id="cancel-reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-3 text-brick">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn mt-4 bg-brick text-white hover:bg-brick/90"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await cancel(code, reason);
            if (!res.ok) setError(res.error);
          })
        }
      >
        {pending ? "Cancelling…" : "Yes, cancel booking"}
      </button>
    </div>
  );
}

export function PayButton({ code, label }: { code: string; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await payForBooking(code);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-2 text-brick">{error}</p>}
    </>
  );
}
