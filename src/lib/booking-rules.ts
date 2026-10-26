/** Pure booking rules shared by the account UI (previews) and the server (enforcement). */

import { CANCELLATION } from "@/config/business";
import { istInstant } from "@/lib/time";

export type BookingStatus =
  | "payment_pending"
  | "confirmed"
  | "assigned"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "rated"
  | "cancelled";

/** The customer-facing journey from spec §10, in order. */
export const STATUS_FLOW: { status: BookingStatus; label: string }[] = [
  { status: "payment_pending", label: "Requested" },
  { status: "confirmed", label: "Confirmed" },
  { status: "assigned", label: "Washer assigned" },
  { status: "on_the_way", label: "On the way" },
  { status: "arrived", label: "Arrived" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
  { status: "rated", label: "Rated" },
];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  ...(Object.fromEntries(STATUS_FLOW.map((s) => [s.status, s.label])) as Record<BookingStatus, string>),
  payment_pending: "Payment pending",
  cancelled: "Cancelled",
};

const CHANGEABLE: BookingStatus[] = ["payment_pending", "confirmed", "assigned"];
const UPCOMING: BookingStatus[] = ["payment_pending", "confirmed", "assigned", "on_the_way", "arrived", "in_progress"];

export const isUpcoming = (status: BookingStatus) => UPCOMING.includes(status);

type Timing = { date: string; slotStartMinute: number; status: BookingStatus; now?: Date };

function hoursUntilStart({ date, slotStartMinute, now = new Date() }: Timing) {
  return (istInstant(date, slotStartMinute).getTime() - now.getTime()) / 3_600_000;
}

export function canReschedule(t: Timing): { ok: true } | { ok: false; reason: string } {
  if (!CHANGEABLE.includes(t.status)) return { ok: false, reason: "This booking can no longer be rescheduled." };
  if (hoursUntilStart(t) < CANCELLATION.cutoffHours)
    return { ok: false, reason: `Bookings can be rescheduled up to ${CANCELLATION.cutoffHours} hours before the slot. Please contact support.` };
  return { ok: true };
}

export function cancellationTerms(t: Timing & { amountPaid: number }):
  | { ok: true; fee: number; refund: number; late: boolean }
  | { ok: false; reason: string } {
  if (!CHANGEABLE.includes(t.status)) return { ok: false, reason: "This booking can no longer be cancelled online. Please contact support." };
  const late = hoursUntilStart(t) < CANCELLATION.cutoffHours;
  const fee = late ? Math.min(CANCELLATION.lateCancelFee, t.amountPaid) : 0;
  return { ok: true, fee, refund: t.amountPaid - fee, late };
}
