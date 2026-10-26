"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { BookingError, settlePayment, startPayment } from "@/server/bookings";

const method = z.enum(["upi", "card", "netbanking", "wallet"]);

/** Mock checkout result. With Razorpay this is replaced by signature verification + webhook. */
export async function completeMockPayment(paymentId: string, outcome: "success" | "failure", rawMethod: string): Promise<{ error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/pay/${paymentId}`);
  let booking;
  try {
    booking = await settlePayment(
      paymentId,
      user.id,
      outcome === "success" ? { ok: true, method: method.parse(rawMethod) } : { ok: false },
    );
  } catch (e) {
    if (e instanceof BookingError || e instanceof z.ZodError) return { error: e instanceof BookingError ? e.message : "Choose a payment method" };
    throw e;
  }
  // `booking` is the state before this payment: a pending booking has just been confirmed.
  if (outcome === "failure") redirect(`/account/bookings/${booking.code}?payment=failed`);
  redirect(booking.status === "payment_pending" ? `/book/confirmed/${booking.code}` : `/account/bookings/${booking.code}?payment=done`);
}

/** Starts a new payment for a pending booking (retry) or its remaining balance. */
export async function payForBooking(code: string): Promise<{ error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/account/bookings/${code}`);
  let paymentId;
  try {
    paymentId = await startPayment(code, user.id);
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
  redirect(`/pay/${paymentId}`);
}
