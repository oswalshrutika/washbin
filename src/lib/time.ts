/** Date helpers pinned to IST (UTC+05:30, no DST). Calendar dates are "YYYY-MM-DD" strings. */

const IST_OFFSET_MS = 330 * 60_000;

export function istDate(at: Date | number = Date.now()): string {
  return new Date(+at + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The instant a given minute-of-day begins on an IST calendar date. */
export function istInstant(date: string, minuteOfDay: number): Date {
  return new Date(Date.parse(`${date}T00:00:00+05:30`) + minuteOfDay * 60_000);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const longDayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export const formatDay = (date: string) => dayFmt.format(new Date(`${date}T00:00:00Z`));
export const formatLongDay = (date: string) => longDayFmt.format(new Date(`${date}T00:00:00Z`));
export const formatDateTime = (at: Date) => dateTimeFmt.format(at).replace(/\b(am|pm)\b/, (m) => m.toUpperCase()); // match slot labels

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}
