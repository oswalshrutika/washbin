"use client";

import { useState, useTransition } from "react";
import { saveName, sendOtp, verifyOtp } from "@/app/actions/auth";
import { formatPhone } from "@/lib/phone";

type Step = { kind: "phone" } | { kind: "code"; phone: string; devCode: string | null } | { kind: "name" };

/** Phone + OTP sign-in. Calls onSignedIn once the user has a session and a name. */
export function OtpLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "phone" });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(fn);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind === "phone")
      run(async () => {
        const res = await sendOtp(value);
        if (!res.ok) return setError(res.error);
        setValue("");
        setStep({ kind: "code", phone: res.phone, devCode: res.devCode });
      });
    else if (step.kind === "code")
      run(async () => {
        const res = await verifyOtp(step.phone, value);
        if (!res.ok) return setError(res.error);
        setValue("");
        if (res.needsName) setStep({ kind: "name" });
        else onSignedIn();
      });
    else
      run(async () => {
        const res = await saveName(value);
        if (!res.ok) return setError(res.error);
        onSignedIn();
      });
  }

  function resend() {
    if (step.kind !== "code") return;
    run(async () => {
      const res = await sendOtp(step.phone);
      if (!res.ok) return setError(res.error);
      setStep({ kind: "code", phone: res.phone, devCode: res.devCode });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {step.kind === "phone" && (
        <div>
          <label className="label" htmlFor="otp-phone">
            Mobile number
          </label>
          <div className="flex">
            <span className="grid min-h-12 place-items-center rounded-l-[var(--radius-field)] border-2 border-r-0 border-ink/15 bg-grout px-3 font-semibold">
              +91
            </span>
            <input
              id="otp-phone"
              className="field rounded-l-none"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              maxLength={11}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d ]/g, ""))}
              autoFocus
            />
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">We&apos;ll send a 6-digit OTP by SMS.</p>
        </div>
      )}

      {step.kind === "code" && (
        <div>
          <label className="label" htmlFor="otp-code">
            OTP sent to {formatPhone(step.phone)}
          </label>
          <input
            id="otp-code"
            className="field text-center font-display text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {step.devCode && (
            <p className="mt-2 rounded-[var(--radius-tile)] bg-marigold/20 px-3 py-2 text-sm">
              Test mode, no SMS is sent. Your OTP is <strong>{step.devCode}</strong>.
            </p>
          )}
          <p className="mt-2 flex gap-4 text-sm">
            <button type="button" className="btn-quiet" onClick={resend} disabled={pending}>
              Resend OTP
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                setValue("");
                setStep({ kind: "phone" });
              }}
            >
              Change number
            </button>
          </p>
        </div>
      )}

      {step.kind === "name" && (
        <div>
          <label className="label" htmlFor="otp-name">
            Your name
          </label>
          <input id="otp-name" className="field" autoComplete="name" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <p className="mt-1.5 text-sm text-ink-soft">So your washer knows who to ask for.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-brick">
          {error}
        </p>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Please wait…" : step.kind === "phone" ? "Send OTP" : step.kind === "code" ? "Verify and continue" : "Continue"}
      </button>
    </form>
  );
}
