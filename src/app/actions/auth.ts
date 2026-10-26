"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AuthError, getCurrentUser, requestOtp, signOut, verifyOtpAndSignIn } from "@/lib/auth";
import { normalizeIndianMobile } from "@/lib/phone";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function sendOtp(rawPhone: string): Promise<Result<{ phone: string; devCode: string | null }>> {
  const phone = normalizeIndianMobile(rawPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  try {
    const { devCode } = await requestOtp(phone);
    return { ok: true, phone, devCode };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function verifyOtp(phone: string, code: string): Promise<Result<{ needsName: boolean }>> {
  if (!normalizeIndianMobile(phone) || !/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit OTP." };
  try {
    const user = await verifyOtpAndSignIn(phone, code);
    return { ok: true, needsName: !user.name };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function saveName(rawName: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const name = z.string().trim().min(2).max(80).safeParse(rawName);
  if (!name.success) return { ok: false, error: "Enter your name (at least 2 letters)." };
  await db.update(users).set({ name: name.data }).where(eq(users.id, user.id));
  return { ok: true };
}

export async function logout() {
  await signOut();
  redirect("/");
}
