"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OtpLogin } from "@/components/otp-login";

/** Only same-site paths are allowed as a post-login destination. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account/bookings";
}

export function LoginPanel() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  return (
    <OtpLogin
      onSignedIn={() => {
        router.replace(next);
        router.refresh();
      }}
    />
  );
}
