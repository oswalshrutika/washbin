"use client";

import { useState, useTransition } from "react";
import { removeAddress, saveAddress } from "@/app/actions/account";
import { AddressForm } from "@/app/book/step-address";
import { formatAddress } from "@/lib/address";
import type { SavedAddress } from "@/server/addresses";

const LABEL: Record<string, string> = { home: "Home", office: "Office", other: "Other" };

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(addresses.length ? null : "new");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 space-y-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm key={a.id} initial={a} defaultPincode="" save={(input) => saveAddress(a.id, input)} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
        ) : (
          <div key={a.id} className="panel flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <p className="font-bold">{LABEL[a.label] ?? a.label}</p>
              <p className="text-ink-soft">{formatAddress({ ...a, locality: a.locality })}</p>
              {!a.served && <p className="mt-1 text-sm text-brick">We don&apos;t serve this pincode yet.</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-quiet" onClick={() => setEditing(a.id)}>
                Edit
              </button>
              <button
                type="button"
                className="btn-quiet text-brick"
                disabled={pending}
                onClick={() => {
                  if (confirm("Delete this address?")) startTransition(() => removeAddress(a.id));
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}
      {editing === "new" ? (
        <AddressForm defaultPincode="" save={(input) => saveAddress(null, input)} onSaved={() => setEditing(null)} onCancel={addresses.length ? () => setEditing(null) : undefined} />
      ) : (
        <button type="button" className="btn-secondary" onClick={() => setEditing("new")}>
          Add an address
        </button>
      )}
    </div>
  );
}
