/**
 * Slot availability. Pure: callers load the area's existing jobs for the date and pass them in.
 *
 * A slot is an arrival window; the team starts at the slot start. A job occupies a team from its start
 * for its duration plus the travel/setup buffer. A new job fits if, at every moment it would run, fewer
 * than `capacity` teams in the area are already busy.
 */

import { SCHEDULING } from "@/config/business";
import { addDays, istDate, istInstant } from "@/lib/time";

export type SlotTemplate = { id: number; label: string; startMinute: number; endMinute: number };
export type ExistingJob = { startMinute: number; durationMinutes: number };

export type SlotAvailability = SlotTemplate & {
  available: boolean;
  reason: "too_soon" | "past_hours" | "full" | null;
};

export function bookableDates(now: Date = new Date()): string[] {
  const today = istDate(now);
  return Array.from({ length: SCHEDULING.bookingHorizonDays }, (_, i) => addDays(today, i));
}

export function slotAvailability(args: {
  date: string;
  slots: SlotTemplate[];
  jobs: ExistingJob[];
  capacity: number;
  durationMinutes: number;
  now?: Date;
}): SlotAvailability[] {
  const { date, slots, jobs, capacity, durationMinutes, now = new Date() } = args;
  const earliest = now.getTime() + SCHEDULING.minAdvanceHours * 3_600_000;
  const inHorizon = bookableDates(now).includes(date);

  return slots.map((slot) => {
    if (!inHorizon || istInstant(date, slot.startMinute).getTime() < earliest)
      return { ...slot, available: false, reason: "too_soon" };
    if (slot.startMinute + durationMinutes > SCHEDULING.workEndMinute)
      return { ...slot, available: false, reason: "past_hours" };
    if (peakConcurrency(jobs, slot.startMinute, slot.startMinute + durationMinutes + SCHEDULING.bufferMinutes) >= capacity)
      return { ...slot, available: false, reason: "full" };
    return { ...slot, available: true, reason: null };
  });
}

/** Most teams already busy at any moment in [from, to). */
function peakConcurrency(jobs: ExistingJob[], from: number, to: number): number {
  const busy = jobs.map((j) => [j.startMinute, j.startMinute + j.durationMinutes + SCHEDULING.bufferMinutes] as const);
  // Concurrency only rises at a job start, so checking `from` and each start inside the window is enough.
  const points = [from, ...busy.map(([s]) => s).filter((s) => s > from && s < to)];
  return Math.max(0, ...points.map((p) => busy.filter(([s, e]) => s <= p && p < e).length));
}
