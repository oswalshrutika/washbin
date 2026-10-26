import { STATUS_LABEL, type BookingStatus } from "@/lib/booking-rules";

const TONE: Partial<Record<BookingStatus, string>> = {
  payment_pending: "bg-marigold/25 text-ink",
  cancelled: "bg-brick/10 text-brick",
  completed: "bg-grout text-ink",
  rated: "bg-grout text-ink",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${TONE[status] ?? "bg-teal/10 text-teal"}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
