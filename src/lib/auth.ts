import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { otpCodes, sessions, users } from "@/db/schema";
import { otpSender, SHOW_OTP_ON_SCREEN } from "@/lib/providers/otp";

const SESSION_COOKIE = "wb_session";
const SESSION_DAYS = 30;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_WINDOW_MINUTES = 15;
const OTP_RATE_LIMIT = 5;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return s;
}

const hmac = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

export class AuthError extends Error {}

// ---------- OTP ----------

export async function requestOtp(phone: string): Promise<{ devCode: string | null }> {
  const since = new Date(Date.now() - OTP_RATE_WINDOW_MINUTES * 60_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, since)));
  if (n >= OTP_RATE_LIMIT) throw new AuthError("Too many OTP requests. Please try again in 15 minutes.");

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.insert(otpCodes).values({
    phone,
    codeHash: hmac(`${phone}:${code}`),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });
  await otpSender.send(phone, code);
  return { devCode: SHOW_OTP_ON_SCREEN ? code : null };
}

/** Checks the latest OTP for the phone, then signs the user in (creating the account on first login). */
export async function verifyOtpAndSignIn(phone: string, code: string) {
  const otp = await db.query.otpCodes.findFirst({
    where: and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())),
    orderBy: desc(otpCodes.createdAt),
  });
  if (!otp) throw new AuthError("This OTP has expired. Please request a new one.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new AuthError("Too many wrong attempts. Please request a new OTP.");

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hmac(`${phone}:${code}`), "hex");
  if (!timingSafeEqual(expected, actual)) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    throw new AuthError("Incorrect OTP. Please check and try again.");
  }

  const user = await db.transaction(async (tx) => {
    const consumed = await tx
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpCodes.id, otp.id), isNull(otpCodes.consumedAt)))
      .returning({ id: otpCodes.id });
    if (!consumed.length) throw new AuthError("This OTP was already used. Please request a new one.");
    const [row] = await tx
      .insert(users)
      .values({ phone })
      .onConflictDoUpdate({ target: users.phone, set: { phone } })
      .returning();
    return row;
  });
  if (user.blocked) throw new AuthError("This account is blocked. Please contact support.");

  await createSession(user.id);
  return user;
}

// ---------- Sessions ----------

async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ tokenHash: hmac(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hmac(token)));
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = Pick<typeof users.$inferSelect, "id" | "phone" | "name" | "email" | "role" | "notes">;

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db.query.sessions.findFirst({
    where: and(eq(sessions.tokenHash, hmac(token)), gt(sessions.expiresAt, sql`now()`)), // DB clock: render code may not read Date during prerender
    with: { user: true },
  });
  if (!row || row.user.blocked) return null;
  const { id, phone, name, email, role, notes } = row.user;
  return { id, phone, name, email, role, notes };
});

export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
