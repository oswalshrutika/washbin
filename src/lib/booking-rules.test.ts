import { describe, expect, it } from "vitest";
import { cancellationTerms, canReschedule } from "./booking-rules";
import { istInstant } from "./time";

const slot = { date: "2026-11-05", slotStartMinute: 11 * 60 }; // 11 AM IST
const hoursBefore = (h: number) => new Date(istInstant(slot.date, slot.slotStartMinute).getTime() - h * 3_600_000);

describe("cancellationTerms", () => {
  it("refunds everything before the cutoff", () => {
    expect(cancellationTerms({ ...slot, status: "confirmed", amountPaid: 1200_00, now: hoursBefore(24) })).toEqual({
      ok: true,
      fee: 0,
      refund: 1200_00,
      late: false,
    });
  });

  it("keeps the late fee after the cutoff, never more than was paid", () => {
    expect(cancellationTerms({ ...slot, status: "confirmed", amountPaid: 1200_00, now: hoursBefore(2) })).toMatchObject({ fee: 199_00, refund: 1001_00, late: true });
    expect(cancellationTerms({ ...slot, status: "confirmed", amountPaid: 0, now: hoursBefore(2) })).toMatchObject({ fee: 0, refund: 0 });
  });

  it("blocks cancelling once the washer is on the way", () => {
    expect(cancellationTerms({ ...slot, status: "on_the_way", amountPaid: 0, now: hoursBefore(1) }).ok).toBe(false);
  });
});

describe("canReschedule", () => {
  it("allows rescheduling before the cutoff only", () => {
    expect(canReschedule({ ...slot, status: "confirmed", now: hoursBefore(5) }).ok).toBe(true);
    expect(canReschedule({ ...slot, status: "confirmed", now: hoursBefore(3) }).ok).toBe(false);
    expect(canReschedule({ ...slot, status: "cancelled", now: hoursBefore(48) }).ok).toBe(false);
  });
});
