"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { checkPincode, notifyMe, type PincodeResult } from "@/app/actions/public";

export const PINCODE_KEY = "wb_pincode";
export type StoredPincode = { code: string; locality: string };

export function readStoredPincode(): StoredPincode | null {
  try {
    return JSON.parse(localStorage.getItem(PINCODE_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function PincodeChecker({ onServed, compact = false }: { onServed?: (p: StoredPincode) => void; compact?: boolean }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const stored = readStoredPincode();
    if (stored) {
      setCode(stored.code); // eslint-disable-line react-hooks/set-state-in-effect -- restoring client-only storage
      setResult({ status: "served", code: stored.code, locality: stored.locality, city: "" });
    }
  }, []);

  function check(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await checkPincode(code);
      setResult(res);
      if (res.status === "served") {
        const stored = { code: res.code, locality: res.locality };
        localStorage.setItem(PINCODE_KEY, JSON.stringify(stored));
        onServed?.(stored);
      } else {
        localStorage.removeItem(PINCODE_KEY);
      }
    });
  }

  return (
    <div>
      <form onSubmit={check} className="flex gap-2">
        <label htmlFor="pincode" className="sr-only">
          Your pincode
        </label>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="Your pincode, e.g. 411038"
            className="field pl-10"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setResult(null);
            }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={pending || code.length !== 6}>
          {pending ? "Checking…" : "Check"}
        </button>
      </form>
      <div aria-live="polite">
        {result?.status === "invalid" && <p className="mt-2 text-brick">Enter a 6-digit pincode.</p>}
        {result?.status === "served" && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-teal">
            <CheckCircle2 className="size-5" aria-hidden />
            We serve {result.locality} ({result.code}).
            {!compact && (
              <Link href="/services" className="btn-quiet">
                Choose a service
              </Link>
            )}
          </p>
        )}
        {result?.status === "not_served" && <NotServed code={result.code} />}
      </div>
    </div>
  );
}

function NotServed({ code }: { code: string }) {
  const [state, action, pending] = useActionState(notifyMe, null);
  return (
    <div className="mt-3 rounded-[var(--radius-tile)] border-2 border-marigold/60 bg-marigold/10 p-4">
      <p className="font-semibold">Washbin isn&apos;t available in {code} yet.</p>
      <p className="text-ink-soft">We&apos;re in Pune and Pimpri-Chinchwad for now. Leave your number and we&apos;ll tell you when we arrive.</p>
      {state?.ok ? (
        <p className="mt-2 font-semibold text-teal">{state.message}</p>
      ) : (
        <form action={action} className="mt-3 flex gap-2">
          <input type="hidden" name="pincode" value={code} />
          <label htmlFor="notify-contact" className="sr-only">
            Mobile number or email
          </label>
          <input id="notify-contact" name="contact" placeholder="Mobile number or email" className="field flex-1" required />
          <button className="btn-secondary" disabled={pending}>
            Notify me
          </button>
        </form>
      )}
      {state && !state.ok && <p className="mt-2 text-brick">{state.message}</p>}
    </div>
  );
}
