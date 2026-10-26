"use server";

import { z } from "zod";
import { db } from "@/db";
import { areaNotifyRequests, contactMessages, quoteRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { lookupPincode } from "@/lib/catalog";
import { normalizeIndianMobile } from "@/lib/phone";

const pincodeSchema = z.string().trim().regex(/^\d{6}$/);

export type PincodeResult =
  | { status: "served"; code: string; locality: string; city: string }
  | { status: "not_served"; code: string }
  | { status: "invalid" };

export async function checkPincode(raw: string): Promise<PincodeResult> {
  const parsed = pincodeSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const area = await lookupPincode(parsed.data);
  return area
    ? { status: "served", code: area.code, locality: area.locality, city: area.city }
    : { status: "not_served", code: parsed.data };
}

export type FormState = { ok: boolean; message: string } | null;

const contactSchema = z
  .string()
  .trim()
  .refine((v) => normalizeIndianMobile(v) !== null || z.email().safeParse(v).success, "Enter a mobile number or email");

export async function notifyMe(_: FormState, form: FormData): Promise<FormState> {
  const pincode = pincodeSchema.safeParse(form.get("pincode"));
  const contact = contactSchema.safeParse(form.get("contact"));
  if (!pincode.success || !contact.success) return { ok: false, message: "Enter a valid mobile number or email." };
  await db.insert(areaNotifyRequests).values({ pincode: pincode.data, contact: contact.data });
  return { ok: true, message: "Thanks — we'll let you know as soon as Washbin reaches your area." };
}

export async function submitContact(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      contact: contactSchema,
      message: z.string().trim().min(10).max(2000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Please fill in your name, a mobile number or email, and a message of at least 10 characters." };
  await db.insert(contactMessages).values(parsed.data);
  return { ok: true, message: "Message sent. Our team will reply within working hours." };
}

export async function submitQuoteRequest(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().transform((v, ctx) => normalizeIndianMobile(v) ?? (ctx.addIssue({ code: "custom", message: "phone" }), z.NEVER)),
      pincode: pincodeSchema,
      description: z.string().trim().min(15).max(3000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Please add your name, a 10-digit mobile number, a 6-digit pincode, and a few words about the job." };
  if (!(await lookupPincode(parsed.data.pincode)))
    return { ok: false, message: "Washbin isn't available at this pincode yet. Use the area checker on the homepage to get notified." };
  const user = await getCurrentUser();
  await db.insert(quoteRequests).values({ ...parsed.data, userId: user?.id ?? null });
  return { ok: true, message: "Request received. We'll call or WhatsApp you with a quote, usually within 4 working hours." };
}
