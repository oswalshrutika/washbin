"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PAYMENT, type PaymentOption } from "@/config/business";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { SlotAvailability } from "@/lib/availability";
import { getPricingCatalog, lookupPincode } from "@/lib/catalog";
import { amountDueNow, QuoteError, type CartLine, type Quote } from "@/lib/pricing";
import { isIsoDate } from "@/lib/time";
import { AddressError, createAddress, listAddresses, type AddressInput, type SavedAddress } from "@/server/addresses";
import { attachCustomerPhotos, BookingError, createBooking, getAvailability, quoteCart } from "@/server/bookings";
import { readPhotos, savePhotos, UploadError } from "@/server/uploads";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

const cartSchema = z
  .array(
    z.object({
      serviceId: z.number().int(),
      variantId: z.number().int(),
      qty: z.number().int().min(1),
      addons: z.array(z.object({ addonId: z.number().int(), qty: z.number().int().min(1) })).max(20),
    }),
  )
  .min(1, "Add at least one service")
  .max(20);

/** Turns expected domain errors into a message for the customer; anything else is a real bug and throws. */
async function guard<R extends Result<object>>(fn: () => Promise<R>): Promise<R | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof BookingError || e instanceof QuoteError || e instanceof AddressError || e instanceof UploadError)
      return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Please check your booking" };
    throw e;
  }
}

export type BookingSession = { user: { name: string | null; phone: string } | null; addresses: SavedAddress[] };

export async function getBookingSession(): Promise<BookingSession> {
  const user = await getCurrentUser();
  if (!user) return { user: null, addresses: [] };
  return { user: { name: user.name, phone: user.phone }, addresses: await listAddresses(user.id) };
}

export async function getSlots(args: { pincode: string; date: string; cart: unknown }): Promise<Result<{ slots: SlotAvailability[] }>> {
  return guard(async () => {
    if (!isIsoDate(args.date)) return { ok: false, error: "Pick a date" };
    const area = await lookupPincode(args.pincode);
    if (!area) return { ok: false, error: "Washbin isn't available at this pincode yet" };
    const quote = await quoteCart(cartSchema.parse(args.cart), null, null);
    const slots = await getAvailability({ areaId: area.areaId, capacity: area.capacity, date: args.date, durationMinutes: quote.durationMinutes });
    return { ok: true, slots };
  });
}

export type PriceOption = { option: PaymentOption; dueNow: number };

export async function previewQuote(args: { cart: unknown; couponCode: string | null }): Promise<Result<{ quote: Quote; options: PriceOption[] }>> {
  return guard(async () => {
    const user = await getCurrentUser();
    const quote = await quoteCart(cartSchema.parse(args.cart), args.couponCode?.trim() || null, user?.id ?? null);
    const options = (Object.keys(PAYMENT.options) as PaymentOption[])
      .filter((o) => PAYMENT.options[o])
      .map((option) => ({ option, dueNow: amountDueNow(quote.total, option) }));
    return { ok: true, quote, options };
  });
}

export async function addAddress(input: AddressInput): Promise<Result<{ address: SavedAddress }>> {
  return guard(async () => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in again." };
    const row = await createAddress(user.id, input);
    const area = await lookupPincode(row.pincode);
    return { ok: true, address: { ...row, locality: area?.locality ?? null, served: !!area } };
  });
}

const placeSchema = z.object({
  cart: cartSchema,
  date: z.string().refine(isIsoDate, "Pick a date"),
  slotId: z.number().int(),
  addressId: z.number().int(),
  instructions: z
    .string()
    .trim()
    .max(1000, "Keep instructions under 1,000 characters")
    .transform((v) => v || null),
  paymentOption: z.enum(["full", "advance", "after_service", "cash"]),
  couponCode: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .transform((v) => v || null),
});

/** Form data: `payload` (JSON of placeSchema) plus up to 3 `photos`. */
export async function placeBooking(form: FormData): Promise<Result<{ code: string; paymentId: string | null }>> {
  return guard(async () => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in again to book." };
    const input = placeSchema.parse(JSON.parse(String(form.get("payload") ?? "{}")));
    const photos = await readPhotos(form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0));

    const booking = await createBooking({ ...input, userId: user.id });
    await attachCustomerPhotos(booking.bookingId, await savePhotos(`bookings/${booking.bookingId}`, photos));
    return { ok: true, code: booking.code, paymentId: booking.paymentId };
  });
}

export type RebookDraft = { cart: CartLine[]; address: { id: number; pincode: string; locality: string } | null };

/** "Book again": the same services and address as a past booking, re-validated against today's catalog. */
export async function getRebookDraft(code: string): Promise<Result<{ draft: RebookDraft }>> {
  return guard<Result<{ draft: RebookDraft }>>(async () => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in to book again." };
    const booking = await db.query.bookings.findFirst({
      where: and(eq(bookings.code, code), eq(bookings.userId, user.id)),
      with: { items: true },
    });
    if (!booking) return { ok: false, error: "Booking not found" };

    const catalog = await getPricingCatalog();
    const cart: CartLine[] = [];
    for (const item of booking.items) {
      const service = catalog.find((s) => s.id === item.serviceId);
      if (item.kind === "variant" && service?.variants.some((v) => v.id === item.variantId))
        cart.push({ serviceId: item.serviceId, variantId: item.variantId!, qty: item.qty, addons: [] });
      else if (item.kind === "addon" && cart.length && service?.addons.some((a) => a.id === item.addonId))
        cart.at(-1)!.addons.push({ addonId: item.addonId!, qty: item.qty });
    }
    if (!cart.length) return { ok: false, error: "The services from this booking are no longer offered." };

    const saved = booking.addressId ? (await listAddresses(user.id)).find((a) => a.id === booking.addressId && a.served) : undefined;
    return {
      ok: true,
      draft: { cart, address: saved ? { id: saved.id, pincode: saved.pincode, locality: saved.locality! } : null },
    };
  });
}
