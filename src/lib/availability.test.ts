import { describe, expect, it } from "vitest";
import { slotAvailability, type SlotTemplate } from "./availability";
import { istInstant } from "./time";

const slots: SlotTemplate[] = [
  { id: 1, label: "8 – 11 AM", startMinute: 480, endMinute: 660 },
  { id: 2, label: "11 AM – 2 PM", startMinute: 660, endMinute: 840 },
  { id: 3, label: "2 – 5 PM", startMinute: 840, endMinute: 1020 },
  { id: 4, label: "5 – 8 PM", startMinute: 1020, endMinute: 1200 },
];
const today = "2026-11-02";
const morning = istInstant(today, 7 * 60); // 7 AM IST

const run = (overrides: Partial<Parameters<typeof slotAvailability>[0]>) =>
  slotAvailability({ date: "2026-11-03", slots, jobs: [], capacity: 2, durationMinutes: 120, now: morning, ...overrides });

describe("slotAvailability", () => {
  it("opens every slot for a short job tomorrow", () => {
    expect(run({}).every((s) => s.available)).toBe(true);
  });

  it("hides slots inside the minimum advance window", () => {
    const res = run({ date: today }); // now 7 AM; 3 h min advance → 8 AM gone, 11 AM ok
    expect(res.map((s) => s.reason)).toEqual(["too_soon", null, null, null]);
  });

  it("hides slots past the booking horizon", () => {
    expect(run({ date: "2026-12-31" }).every((s) => s.reason === "too_soon")).toBe(true);
  });

  it("hides slots where the job would end after working hours", () => {
    const res = run({ durationMinutes: 300 }); // 5 h: 5 PM start ends 10 PM
    expect(res.find((s) => s.id === 4)?.reason).toBe("past_hours");
    expect(res.find((s) => s.id === 3)?.available).toBe(true); // 2 PM + 5 h = 7 PM
  });

  it("closes a slot once every team is busy, counting duration and buffer", () => {
    const jobs = [
      { startMinute: 480, durationMinutes: 300 }, // 8 AM – 1 PM, busy till 1:30 with buffer
      { startMinute: 660, durationMinutes: 120 }, // 11 AM – 1 PM, busy till 1:30
    ];
    const res = run({ jobs });
    expect(res.find((s) => s.id === 1)?.available).toBe(true); // 2 h job is done by 10:30, before the 11 AM job
    expect(res.find((s) => s.id === 2)?.reason).toBe("full");
    expect(res.find((s) => s.id === 3)?.available).toBe(true); // both free by 1:30 PM
  });

  it("blocks a long job that would still be running when the second team is taken", () => {
    const jobs = [
      { startMinute: 480, durationMinutes: 300 },
      { startMinute: 660, durationMinutes: 120 },
    ];
    expect(run({ jobs, durationMinutes: 240 }).find((s) => s.id === 1)?.reason).toBe("full"); // 8 AM – 12:30 overlaps 11 AM
  });

  it("keeps a slot open while a team is still free", () => {
    const res = run({ jobs: [{ startMinute: 660, durationMinutes: 120 }] });
    expect(res.find((s) => s.id === 2)?.available).toBe(true);
  });
});
