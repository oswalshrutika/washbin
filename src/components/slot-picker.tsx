"use client";

import { useEffect, useState, useTransition } from "react";
import { bookableDates, type SlotAvailability } from "@/lib/availability";
import { formatDay } from "@/lib/time";

export type ChosenSlot = { date: string; slotId: number; label: string };
type LoadSlots = (date: string) => Promise<{ ok: true; slots: SlotAvailability[] } | { ok: false; error: string }>;

const REASON: Record<NonNullable<SlotAvailability["reason"]>, string> = {
  too_soon: "Too soon",
  past_hours: "Runs past closing time",
  full: "Fully booked",
};

/** Date strip + arrival windows. `loadSlots` must be stable or memoised; it reruns when it changes. */
export function SlotPicker({ loadSlots, chosen, onChange }: { loadSlots: LoadSlots; chosen: ChosenSlot | null; onChange: (s: ChosenSlot | null) => void }) {
  const [dates] = useState(() => bookableDates());
  const [date, setDate] = useState<string | null>(chosen?.date ?? null);
  const [slots, setSlots] = useState<SlotAvailability[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!date) return;
    startTransition(async () => {
      const res = await loadSlots(date);
      setSlots(res.ok ? res.slots : null);
      setError(res.ok ? null : res.error);
    });
  }, [date, loadSlots]);

  return (
    <div>
      <h3 className="mb-2 font-semibold">Date</h3>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2" role="radiogroup" aria-label="Date">
        {dates.map((d, i) => {
          const [weekday, ...rest] = formatDay(d).split(" ");
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={d === date}
              className={`min-w-[4.5rem] shrink-0 snap-start rounded-[var(--radius-field)] border-2 px-2 py-2 text-center ${
                d === date ? "border-teal bg-teal text-white" : "border-ink/15 bg-white hover:border-ink/40"
              }`}
              onClick={() => {
                setDate(d);
                if (chosen?.date !== d) onChange(null);
              }}
            >
              <span className="block text-sm">{i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekday.replace(",", "")}</span>
              <span className="block font-semibold">{rest.join(" ")}</span>
            </button>
          );
        })}
      </div>

      {date && (
        <>
          <h3 className="mt-6 mb-2 font-semibold">Arrival time</h3>
          {error && <p className="text-brick">{error}</p>}
          {pending && !slots && <p className="text-ink-soft">Checking open times…</p>}
          {slots && (
            <div className={`grid grid-cols-2 gap-2 ${pending ? "opacity-60" : ""}`} role="radiogroup" aria-label="Arrival time">
              {slots.map((s) => {
                const selected = chosen?.date === date && chosen.slotId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!s.available}
                    className={`rounded-[var(--radius-field)] border-2 px-3 py-3 text-left disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-ink-soft/70 ${
                      selected ? "border-teal bg-teal text-white" : "border-ink/15 bg-white hover:border-ink/40"
                    }`}
                    onClick={() => onChange({ date, slotId: s.id, label: s.label })}
                  >
                    <span className="block font-semibold">{s.label}</span>
                    {s.reason && <span className="block text-sm">{REASON[s.reason]}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {slots?.every((s) => !s.available) && <p className="mt-3 text-ink-soft">No times left on this day. Please pick another date.</p>}
          <p className="mt-3 text-sm text-ink-soft">The team arrives within the window you choose.</p>
        </>
      )}
    </div>
  );
}
