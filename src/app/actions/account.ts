"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import type { SlotAvailability } from "@/lib/availability";
import { lookupPincode } from "@/lib/catalog";
import { isIsoDate } from "@/lib/time";
import { AddressError, createAddress, deleteAddress, updateAddress, type AddressInput, type SavedAddress } from "@/server/addresses";
import { BookingError, cancelBooking, getAvailability, rescheduleBooking } from "@/server/bookings";
import { getCustomerBooking } from "@/server/booking-queries";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function signedIn(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return user;
}

function failure(e: unknown): { ok: false; error: string } {
  if (e instanceof BookingError || e instanceof AddressError) return { ok: false, error: e.message };
  throw e;
}

// ---------- Profile ----------

export type FormState = { ok: boolean; message: string } | null;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).transform((v) => v || null),
  notes: z.string().trim().max(500, "Keep notes under 500 characters").transform((v) => v || null),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await signedIn();
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  revalidatePath("/account");
  return { ok: true, message: "Profile saved." };
}

export async function requestAccountDeletion(): Promise<FormState> {
  const user = await signedIn();
  await db.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/account");
  return { ok: true, message: "Deletion requested. Our team will confirm by SMS within 7 days." };
}

// ---------- Addresses ----------

export async function saveAddress(id: number | null, input: AddressInput): Promise<Result<{ address: SavedAddress }>> {
  const user = await signedIn();
  try {
    const row = id ? await updateAddress(user.id, id, input) : await createAddress(user.id, input);
    const area = await lookupPincode(row.pincode);
    revalidatePath("/account/addresses");
    return { ok: true, address: { ...row, locality: area?.locality ?? null, served: !!area } };
  } catch (e) {
    return failure(e);
  }
}

export async function removeAddress(id: number): Promise<void> {
  const user = await signedIn();
  await deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
}

// ---------- Bookings ----------

export async function getRescheduleSlots(code: string, date: string): Promise<Result<{ slots: SlotAvailability[] }>> {
  const user = await signedIn();
  if (!isIsoDate(date)) return { ok: false, error: "Pick a date" };
  const booking = await getCustomerBooking(code, user.id);
  if (!booking) return { ok: false, error: "Booking not found" };
  const area = await lookupPincode(booking.address.pincode);
  if (!area) return { ok: false, error: "Washbin isn't available at this address's pincode yet" };
  const slots = await getAvailability({
    areaId: area.areaId,
    capacity: area.capacity,
    date,
    durationMinutes: booking.durationMinutes,
    excludeBookingId: booking.id,
  });
  return { ok: true, slots };
}

export async function reschedule(code: string, date: string, slotId: number): Promise<Result> {
  const user = await signedIn();
  if (!isIsoDate(date) || !Number.isInteger(slotId)) return { ok: false, error: "Pick a new date and time" };
  try {
    await rescheduleBooking(code, user.id, date, slotId);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(`/account/bookings/${code}`);
  return { ok: true };
}

export async function cancel(code: string, reason: string): Promise<Result> {
  const user = await signedIn();
  const why = z.string().trim().min(2).max(300).safeParse(reason);
  if (!why.success) return { ok: false, error: "Tell us why you're cancelling" };
  try {
    await cancelBooking(code, user.id, why.data);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(`/account/bookings/${code}`);
  return { ok: true };
}

// ---------- Notifications ----------

export async function markNotificationsRead(): Promise<void> {
  const user = await signedIn();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/account/notifications");
}
