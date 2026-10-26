import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { logout } from "@/app/actions/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/time";
import { DeleteAccount, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { id } = await requireUser("/account");
  const user = (await db.query.users.findFirst({ where: eq(users.id, id) }))!;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Profile</h1>
      <p className="mt-1 text-ink-soft">Signed in as +{user.phone}</p>
      <ProfileForm name={user.name ?? ""} email={user.email ?? ""} notes={user.notes ?? ""} />

      <form action={logout} className="mt-10">
        <button className="btn-secondary">Log out</button>
      </form>

      <section className="mt-12 border-t-2 border-grout pt-6">
        <h2 className="text-xl font-bold">Delete account</h2>
        {user.deletionRequestedAt ? (
          <p className="mt-1">You asked us to delete your account on {formatDateTime(user.deletionRequestedAt)}. Our team will confirm by SMS.</p>
        ) : (
          <DeleteAccount />
        )}
      </section>
    </>
  );
}
