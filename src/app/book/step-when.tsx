"use client";

import { useCallback } from "react";
import { getSlots } from "@/app/actions/booking";
import { PincodeChecker, type StoredPincode } from "@/components/pincode-checker";
import { SlotPicker, type ChosenSlot } from "@/components/slot-picker";
import type { CartLine } from "@/lib/pricing";

export type { ChosenSlot };

export function StepWhen({
  cart,
  pincode,
  setPincode,
  chosen,
  setChosen,
  notice,
}: {
  cart: CartLine[];
  pincode: StoredPincode | null;
  setPincode: (p: StoredPincode | null) => void;
  chosen: ChosenSlot | null;
  setChosen: (s: ChosenSlot | null) => void;
  notice: string | null;
}) {
  const code = pincode?.code;
  const loadSlots = useCallback((date: string) => getSlots({ pincode: code!, date, cart }), [code, cart]);

  if (!pincode)
    return (
      <div>
        <h2 className="text-2xl font-bold">Where is the job?</h2>
        <p className="mt-1 mb-4 text-ink-soft">Enter the pincode so we can show open times in your area.</p>
        <PincodeChecker onServed={setPincode} compact />
      </div>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold">When should we come?</h2>
      <p className="mt-1 mb-6 text-ink-soft">
        In {pincode.locality} ({pincode.code}).{" "}
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            setPincode(null);
            setChosen(null);
          }}
        >
          Change area
        </button>
      </p>
      {notice && <p className="mb-6 rounded-[var(--radius-tile)] bg-marigold/20 p-3">{notice}</p>}
      <SlotPicker loadSlots={loadSlots} chosen={chosen} onChange={setChosen} />
    </div>
  );
}
