"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions/public";

/** A form bound to a public server action. Shows the result message and hides the fields once it succeeds. */
export function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  if (state?.ok)
    return (
      <p role="status" className="rounded-[var(--radius-tile)] bg-teal/10 p-4 font-semibold text-teal">
        {state.message}
      </p>
    );
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state && (
        <p role="alert" className="text-brick">
          {state.message}
        </p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
