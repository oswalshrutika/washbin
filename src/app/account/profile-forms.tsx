"use client";

import { useActionState } from "react";
import { requestAccountDeletion, updateProfile } from "@/app/actions/account";

export function ProfileForm({ name, email, notes }: { name: string; email: string; notes: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" className="field" defaultValue={name} required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email (optional, for invoices)
        </label>
        <input id="email" name="email" type="email" className="field" defaultValue={email} autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes for every visit
        </label>
        <textarea id="notes" name="notes" rows={3} className="field" defaultValue={notes} placeholder="Pets at home, gate code, where to park" />
      </div>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "font-semibold text-teal" : "text-brick"}>
          {state.message}
        </p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function DeleteAccount() {
  const [state, action, pending] = useActionState(requestAccountDeletion, null);
  if (state?.ok) return <p className="mt-1 font-semibold text-teal">{state.message}</p>;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Request deletion of your Washbin account? Upcoming bookings will be cancelled by our team.")) e.preventDefault();
      }}
      className="mt-2"
    >
      <p className="text-ink-soft">We&apos;ll delete your profile and addresses. Invoices are kept as required by tax law.</p>
      <button className="btn-quiet mt-2 text-brick" disabled={pending}>
        Request account deletion
      </button>
    </form>
  );
}
