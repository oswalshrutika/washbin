"use client";

import { useState, useTransition } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { addAddress } from "@/app/actions/booking";
import { OtpLogin } from "@/components/otp-login";
import { formatAddress } from "@/lib/address";
import type { SavedAddress } from "@/server/addresses";

const LABELS = { home: "Home", office: "Office", other: "Other" } as const;

export function StepAddress({
  signedIn,
  onSignedIn,
  addresses,
  setAddresses,
  selectedId,
  onSelect,
  pincode,
}: {
  signedIn: boolean;
  onSignedIn: () => void;
  addresses: SavedAddress[];
  setAddresses: (a: SavedAddress[]) => void;
  selectedId: number | null;
  onSelect: (a: SavedAddress) => void;
  pincode: string | null;
}) {
  const [adding, setAdding] = useState(false);

  if (!signedIn)
    return (
      <div className="max-w-sm">
        <h2 className="text-2xl font-bold">Sign in to book</h2>
        <p className="mt-1 mb-5 text-ink-soft">We&apos;ll send booking updates to this number. Your cart is saved.</p>
        <OtpLogin onSignedIn={onSignedIn} />
      </div>
    );

  const showForm = adding || addresses.length === 0;
  return (
    <div>
      <h2 className="text-2xl font-bold">Where should we come?</h2>
      {addresses.length > 0 && (
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Saved addresses">
          {addresses.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={a.id === selectedId}
              disabled={!a.served}
              onClick={() => onSelect(a)}
              className={`flex w-full gap-3 rounded-[var(--radius-field)] border-2 p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                a.id === selectedId ? "border-teal bg-teal/10" : "border-ink/15 bg-white hover:border-ink/40"
              }`}
            >
              <MapPin className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
              <span>
                <span className="block font-semibold">{LABELS[a.label as keyof typeof LABELS] ?? a.label}</span>
                <span className="block text-ink-soft">{formatAddress(a)}</span>
                {!a.served && <span className="block text-sm text-brick">We don&apos;t serve this pincode yet</span>}
              </span>
            </button>
          ))}
        </div>
      )}
      {showForm ? (
        <AddressForm
          defaultPincode={pincode ?? ""}
          onCancel={addresses.length ? () => setAdding(false) : undefined}
          onSaved={(a) => {
            setAddresses([a, ...addresses]);
            setAdding(false);
            onSelect(a);
          }}
        />
      ) : (
        <button type="button" className="btn-secondary mt-4" onClick={() => setAdding(true)}>
          Add a new address
        </button>
      )}
    </div>
  );
}

export function AddressForm({
  defaultPincode,
  onSaved,
  onCancel,
  save = addAddress,
  initial,
}: {
  defaultPincode: string;
  initial?: SavedAddress;
  onSaved: (a: SavedAddress) => void;
  onCancel?: () => void;
  save?: typeof addAddress;
}) {
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  function locate() {
    if (!navigator.geolocation) return setError("Your browser can't share location. You can skip this.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. You can skip this; the address is enough.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "");
    startTransition(async () => {
      const res = await save({
        label: text("label") as "home" | "office" | "other",
        flat: text("flat"),
        wing: text("wing"),
        society: text("society"),
        street: text("street"),
        landmark: text("landmark"),
        pincode: text("pincode"),
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      });
      if (res.ok) onSaved(res.address);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="panel mt-4 space-y-4 p-4">
      <fieldset>
        <legend className="label">Save as</legend>
        <div className="flex gap-2">
          {Object.entries(LABELS).map(([value, label], i) => (
            <label key={value} className="cursor-pointer rounded-[var(--radius-field)] border-2 border-ink/15 px-3.5 py-2 has-checked:border-teal has-checked:bg-teal/10 has-focus-visible:outline-3 has-focus-visible:outline-teal">
              <input type="radio" name="label" value={value} defaultChecked={initial ? initial.label === value : i === 0} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field name="flat" label="Flat / house no." required autoComplete="address-line1" defaultValue={initial?.flat} />
        <Field name="wing" label="Wing (optional)" defaultValue={initial?.wing ?? ""} />
      </div>
      <Field name="society" label="Society or building" required defaultValue={initial?.society} />
      <Field name="street" label="Street or area (optional)" autoComplete="address-line2" defaultValue={initial?.street ?? ""} />
      <Field name="landmark" label="Landmark (optional)" defaultValue={initial?.landmark ?? ""} />
      <Field name="pincode" label="Pincode" required defaultValue={initial?.pincode ?? defaultPincode} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
      <div>
        <button type="button" className="btn-quiet" onClick={locate} disabled={locating}>
          <LocateFixed className="size-4" aria-hidden />
          {location ? "Location added" : locating ? "Getting location…" : "Add my current location (helps the washer find you)"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-brick">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ name, label, ...props }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`addr-${name}`}>
        {label}
      </label>
      <input id={`addr-${name}`} name={name} className="field" {...props} />
    </div>
  );
}
