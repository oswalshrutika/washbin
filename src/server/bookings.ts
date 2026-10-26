import "server-only";
import { randomInt } from "node:crypto";
import { and, count, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { PAYMENT, PAYMENT_HOLD_MINUTES, type PaymentOption } from "@/config/business";
import { db, type Tx } from "@/db";
import {
  addresses,
  bookingEvents,
  bookingItems,
  bookingPhotos,
  bookings,
  couponRedemptions,
  coupons,
  payments,
  refunds,
  slotTemplates,
  type AddressSnapshot,
} from "@/db/schema";
import { slotAvailability, type ExistingJob } from "@/lib/availability";
import { cancellationTerms, canReschedule } from "@/lib/booking-rules";
import { getPricingCatalog, getSlotTemplates, lookupPincode } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { amountDueNow, computeQuote, type ApplicableCoupon, type CartLine, type Quote } from "@/lib/pricing";
import { gateway, mockPaymentId } from "@/lib/providers/payments";
import { formatDay } from "@/lib/time";
import { notify } from "@/server/notifications";

export class BookingError extends Error {}

type Conn = typeof db | Tx;

// ---------- Availability ----------

/** Jobs that occupy a team in the area on that date. Unpaid bookings hold their slot only briefly. */
async function areaJobs(conn: Conn, areaId: number, date: string, excludeBookingId?: number): Promise<ExistingJob[]> {
  const holdSince = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60_000);
  const rows = await conn
    .select({ startMinute: slotTemplates.startMinute, durationMinutes: bookings.durationMinutes })
    .from(bookings)
    .innerJoin(slotTemplates, eq(bookings.slotId, slotTemplates.id))
    .where(
      and(
        eq(bookings.areaId, areaId),
        eq(bookings.date, date),
        ne(bookings.status, "cancelled"),
        or(ne(bookings.status, "payment_pending"), gt(bookings.createdAt, holdSince)),
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined,
      ),
    );
  return rows;
}

export async function getAvailability(args: { areaId: number; capacity: number; date: string; durationMinutes: number; excludeBookingId?: number; conn?: Conn }) {
  const [slots, jobs] = await Promise.all([
    getSlotTemplates(),
    areaJobs(args.conn ?? db, args.areaId, args.date, args.excludeBookingId),
  ]);
  return slotAvailability({ date: args.date, slots, jobs, capacity: args.capacity, durationMinutes: args.durationMinutes });
}

/** Serialises bookings for one area + date so two customers can't take the last team at once. */
async function lockAreaDate(tx: Tx, areaId: number, date: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(${areaId}, ${Number(date.replaceAll("-", ""))})`);
}

async function assertSlotOpen(tx: Tx, args: { areaId: number; capacity: number; date: string; slotId: number; durationMinutes: number; excludeBookingId?: number }) {
  const slots = await getAvailability({ ...args, conn: tx });
  const slot = slots.find((s) => s.id === args.slotId);
  if (!slot?.available) throw new BookingError("Sorry, that slot was just taken. Please pick another time.");
  return slot;
}

// ---------- Coupons ----------

async function hasPriorBookings(conn: Conn, userId: string) {
  const [{ n }] = await conn
    .select({ n: count() })
    .from(bookings)
    .where(and(eq(bookings.userId, userId), inArray(bookings.status, ["confirmed", "assigned", "on_the_way", "arrived", "in_progress", "completed", "rated"])));
  return n > 0;
}

/** Checks the DB-side coupon rules. Returns a coupon for computeQuote, or an error message for the customer. */
export async function resolveCoupon(code: string, userId: string | null, conn: Conn = db): Promise<{ coupon: ApplicableCoupon } | { error: string }> {
  const c = await conn.query.coupons.findFirst({ where: eq(coupons.code, code.trim().toUpperCase()) });
  if (!c || !c.active) return { error: "This code isn't valid" };
  if (c.expiresAt && c.expiresAt < new Date()) return { error: "This code has expired" };
  if (c.usageLimit !== null) {
    const [{ n }] = await conn.select({ n: count() }).from(couponRedemptions).where(eq(couponRedemptions.code, c.code));
    if (n >= c.usageLimit) return { error: "This code has been fully redeemed" };
  }
  if (userId) {
    const [{ n }] = await conn
      .select({ n: count() })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.code, c.code), eq(couponRedemptions.userId, userId)));
    if (n >= c.perUserLimit) return { error: "You've already used this code" };
    if (c.firstBookingOnly && (await hasPriorBookings(conn, userId))) return { error: "This code is for your first booking only" };
  }
  return {
    coupon: { code: c.code, type: c.type, value: c.value, maxDiscount: c.maxDiscount, minOrder: c.minOrder, serviceId: c.serviceId },
  };
}

export async function quoteCart(cart: CartLine[], couponCode: string | null, userId: string | null, conn: Conn = db) {
  const catalog = await getPricingCatalog();
  let coupon: ApplicableCoupon | null = null;
  let couponError: string | null = null;
  if (couponCode) {
    const res = await resolveCoupon(couponCode, userId, conn);
    if ("coupon" in res) coupon = res.coupon;
    else couponError = res.error;
  }
  const quote = computeQuote(cart, catalog, coupon);
  return { ...quote, couponError: couponError ?? quote.couponError } satisfies Quote;
}

// ---------- Create ----------

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => `WB-${Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("")}`;

export type CreateBookingInput = {
  userId: string;
  cart: CartLine[];
  date: string;
  slotId: number;
  addressId: number;
  instructions: string | null;
  paymentOption: PaymentOption;
  couponCode: string | null;
};

export async function createBooking(input: CreateBookingInput) {
  if (!PAYMENT.options[input.paymentOption]) throw new BookingError("That payment option isn't available");

  const address = await db.query.addresses.findFirst({
    where: and(eq(addresses.id, input.addressId), eq(addresses.userId, input.userId), isNull(addresses.deletedAt)),
  });
  if (!address) throw new BookingError("Please choose a saved address");
  const area = await lookupPincode(address.pincode);
  if (!area) throw new BookingError("Washbin isn't available at this address's pincode yet");

  const result = await db.transaction(async (tx) => {
    await lockAreaDate(tx, area.areaId, input.date);
    const quote = await quoteCart(input.cart, input.couponCode, input.userId, tx);
    if (input.couponCode && !quote.couponCode) throw new BookingError(quote.couponError ?? "This code can't be applied");
    await assertSlotOpen(tx, { areaId: area.areaId, capacity: area.capacity, date: input.date, slotId: input.slotId, durationMinutes: quote.durationMinutes });

    const dueNow = amountDueNow(quote.total, input.paymentOption);
    const snapshot: AddressSnapshot = {
      label: address.label,
      flat: address.flat,
      wing: address.wing,
      society: address.society,
      street: address.street,
      landmark: address.landmark,
      locality: area.locality,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    };

    let booking: typeof bookings.$inferSelect | undefined;
    for (let attempt = 0; !booking && attempt < 5; attempt++) {
      [booking] = await tx
        .insert(bookings)
        .values({
          code: newCode(),
          userId: input.userId,
          addressId: address.id,
          address: snapshot,
          areaId: area.areaId,
          date: input.date,
          slotId: input.slotId,
          durationMinutes: quote.durationMinutes,
          status: dueNow > 0 ? "payment_pending" : "confirmed",
          paymentOption: input.paymentOption,
          subtotal: quote.subtotal,
          visitCharge: quote.visitCharge,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          dueNow,
          couponCode: quote.couponCode,
          instructions: input.instructions,
        })
        .onConflictDoNothing({ target: bookings.code })
        .returning();
    }
    if (!booking) throw new Error("Could not allocate a booking code");

    await tx.insert(bookingItems).values(
      quote.lines.map((l) => ({
        bookingId: booking.id,
        serviceId: l.serviceId,
        kind: l.kind,
        variantId: l.variantId,
        addonId: l.addonId,
        name: l.name,
        unitPrice: l.unitPrice,
        qty: l.qty,
        durationMinutes: l.durationMinutes,
      })),
    );
    await tx.insert(bookingEvents).values({ bookingId: booking.id, type: "payment_pending", note: "Booking requested" });

    let paymentId: string | null = null;
    if (dueNow > 0) {
      paymentId = await createPayment(tx, booking.id, booking.code, input.paymentOption === "full" ? "full" : "advance", dueNow);
    } else {
      await confirm(tx, booking);
    }
    return { booking, paymentId };
  });

  if (!result.paymentId) await notifyConfirmed(result.booking);
  return { code: result.booking.code, bookingId: result.booking.id, paymentId: result.paymentId };
}

export async function attachCustomerPhotos(bookingId: number, paths: string[]) {
  if (paths.length) await db.insert(bookingPhotos).values(paths.map((path) => ({ bookingId, kind: "customer" as const, path })));
}

async function confirm(tx: Tx, booking: typeof bookings.$inferSelect) {
  await tx.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, booking.id));
  await tx.insert(bookingEvents).values({ bookingId: booking.id, type: "confirmed", note: "Booking confirmed. Finding the best washer for you." });
  if (booking.couponCode)
    await tx.insert(couponRedemptions).values({ code: booking.couponCode, userId: booking.userId, bookingId: booking.id }).onConflictDoNothing();
}

async function notifyConfirmed(booking: typeof bookings.$inferSelect) {
  const slot = (await getSlotTemplates()).find((s) => s.id === booking.slotId);
  await notify({
    userId: booking.userId,
    bookingId: booking.id,
    event: "booking_confirmed",
    title: `Booking ${booking.code} confirmed`,
    body: `${formatDay(booking.date)}, ${slot?.label ?? ""}. We'll share your washer's details once assigned.`,
  });
}

// ---------- Payments ----------

async function createPayment(conn: Conn, bookingId: number, receipt: string, purpose: "full" | "advance" | "balance", amount: number) {
  const { orderId } = await gateway.createOrder({ amount, receipt });
  const [p] = await conn
    .insert(payments)
    .values({ bookingId, purpose, amount, provider: gateway.name, providerOrderId: orderId })
    .returning({ id: payments.id });
  return p.id;
}

async function ownedBooking(code: string, userId: string) {
  const booking = await db.query.bookings.findFirst({ where: and(eq(bookings.code, code), eq(bookings.userId, userId)) });
  if (!booking) throw new BookingError("Booking not found");
  return booking;
}

/** Starts a fresh payment for a pending booking (after a failure) or for the remaining balance. */
export async function startPayment(code: string, userId: string) {
  const booking = await ownedBooking(code, userId);
  if (booking.status === "cancelled") throw new BookingError("This booking was cancelled");
  if (booking.status === "payment_pending") {
    return createPayment(db, booking.id, booking.code, booking.paymentOption === "full" ? "full" : "advance", booking.dueNow - booking.amountPaid);
  }
  const balance = booking.total - booking.amountPaid;
  if (balance <= 0) throw new BookingError("Nothing left to pay on this booking");
  return createPayment(db, booking.id, booking.code, "balance", balance);
}

export async function getPaymentForCheckout(paymentId: string, userId: string) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId), with: { booking: true } });
  if (!payment || payment.booking.userId !== userId) return null;
  return payment;
}

/**
 * Settles a mock checkout. With Razorpay this becomes the verified payment handler/webhook.
 * If the payment comes after the slot hold expired, the slot is re-checked before money is taken.
 */
export async function settlePayment(paymentId: string, userId: string, outcome: { ok: true; method: string } | { ok: false }) {
  const payment = await getPaymentForCheckout(paymentId, userId);
  if (!payment) throw new BookingError("Payment not found");
  if (payment.status !== "created") throw new BookingError("This payment has already been processed");
  const booking = payment.booking;

  if (!outcome.ok) {
    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, payment.id));
      await tx.insert(bookingEvents).values({ bookingId: booking.id, type: "payment_failed", note: "Payment failed. No money was taken." });
    });
    if (booking.status === "payment_pending")
      await notify({
        userId,
        bookingId: booking.id,
        event: "payment_failed",
        title: `Payment failed for ${booking.code}`,
        body: "Your slot is held for a few minutes. Retry from My Bookings to confirm it.",
      });
    return booking;
  }

  const confirmedNow = await db.transaction(async (tx) => {
    if (booking.status === "payment_pending") {
      const area = await lookupPincode(booking.address.pincode);
      if (!area) throw new BookingError("Washbin isn't available at this address's pincode yet");
      await lockAreaDate(tx, booking.areaId, booking.date);
      await assertSlotOpen(tx, { areaId: booking.areaId, capacity: area.capacity, date: booking.date, slotId: booking.slotId, durationMinutes: booking.durationMinutes, excludeBookingId: booking.id });
    } else if (booking.status === "cancelled") {
      throw new BookingError("This booking was cancelled");
    }
    const captured = await tx
      .update(payments)
      .set({ status: "captured", method: outcome.method, providerPaymentId: mockPaymentId(), updatedAt: new Date() })
      .where(and(eq(payments.id, payment.id), eq(payments.status, "created")))
      .returning({ id: payments.id });
    if (!captured.length) throw new BookingError("This payment has already been processed");
    await tx
      .update(bookings)
      .set({ amountPaid: sql`${bookings.amountPaid} + ${payment.amount}` })
      .where(eq(bookings.id, booking.id));
    await tx.insert(bookingEvents).values({ bookingId: booking.id, type: "payment_captured", note: `${formatINR(payment.amount)} paid via ${outcome.method.toUpperCase()}` });
    if (booking.status === "payment_pending") {
      await confirm(tx, booking);
      return true;
    }
    return false;
  });

  await notify({
    userId,
    bookingId: booking.id,
    event: "payment_receipt",
    title: `Payment received — ${formatINR(payment.amount)}`,
    body: `Receipt for booking ${booking.code}. Download the invoice from My Bookings.`,
  });
  if (confirmedNow) await notifyConfirmed(booking);
  return booking;
}

// ---------- Reschedule & cancel ----------

export async function rescheduleBooking(code: string, userId: string, date: string, slotId: number) {
  const booking = await ownedBooking(code, userId);
  const slots = await getSlotTemplates();
  const current = slots.find((s) => s.id === booking.slotId)!;
  const check = canReschedule({ date: booking.date, slotStartMinute: current.startMinute, status: booking.status });
  if (!check.ok) throw new BookingError(check.reason);
  const area = await lookupPincode(booking.address.pincode);
  if (!area) throw new BookingError("Washbin isn't available at this address's pincode yet");
  const next = slots.find((s) => s.id === slotId);
  if (!next) throw new BookingError("Please choose a valid slot");

  await db.transaction(async (tx) => {
    await lockAreaDate(tx, area.areaId, date);
    await assertSlotOpen(tx, { areaId: area.areaId, capacity: area.capacity, date, slotId, durationMinutes: booking.durationMinutes, excludeBookingId: booking.id });
    await tx.update(bookings).set({ date, slotId }).where(eq(bookings.id, booking.id));
    await tx.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "rescheduled",
      note: `Moved from ${formatDay(booking.date)} ${current.label} to ${formatDay(date)} ${next.label}`,
    });
  });
  await notify({
    userId,
    bookingId: booking.id,
    event: "booking_rescheduled",
    title: `Booking ${booking.code} rescheduled`,
    body: `New time: ${formatDay(date)}, ${next.label}.`,
  });
}

export async function cancelBooking(code: string, userId: string, reason: string) {
  const booking = await ownedBooking(code, userId);
  const slot = (await getSlotTemplates()).find((s) => s.id === booking.slotId)!;
  const terms = cancellationTerms({ date: booking.date, slotStartMinute: slot.startMinute, status: booking.status, amountPaid: booking.amountPaid });
  if (!terms.ok) throw new BookingError(terms.reason);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason })
      .where(and(eq(bookings.id, booking.id), ne(bookings.status, "cancelled")))
      .returning({ id: bookings.id });
    if (!updated.length) throw new BookingError("This booking is already cancelled");

    // Refund captured payments newest-first until the refundable amount is covered.
    let remaining = terms.refund;
    const captured = await tx.query.payments.findMany({
      where: and(eq(payments.bookingId, booking.id), eq(payments.status, "captured")),
      orderBy: desc(payments.createdAt),
    });
    for (const p of captured) {
      if (remaining <= 0) break;
      const amount = Math.min(remaining, p.amount);
      await gateway.refund({ providerPaymentId: p.providerPaymentId!, amount });
      await tx.insert(refunds).values({ bookingId: booking.id, paymentId: p.id, amount, destination: "original", status: "initiated", reason: "Customer cancellation" });
      remaining -= amount;
    }
    await tx.insert(bookingEvents).values({
      bookingId: booking.id,
      type: "cancelled",
      note: [
        `Cancelled by customer: ${reason}`,
        terms.refund > 0 ? `Refund of ${formatINR(terms.refund)} initiated to the original payment method` : null,
        terms.fee > 0 ? `Late cancellation fee ${formatINR(terms.fee)}` : null,
      ]
        .filter(Boolean)
        .join(". "),
    });
  });
  await notify({
    userId,
    bookingId: booking.id,
    event: "booking_cancelled",
    title: `Booking ${booking.code} cancelled`,
    body: terms.refund > 0 ? `Your refund of ${formatINR(terms.refund)} will reach your original payment method in 5–7 working days.` : "Your booking has been cancelled.",
  });
  return terms;
}
