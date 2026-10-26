import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-4xl font-extrabold">Sign in</h1>
      <p className="mt-2 mb-8 text-ink-soft">Use your mobile number to book and manage your cleanings. New here? This creates your account.</p>
      <Suspense>
        <LoginPanel />
      </Suspense>
    </div>
  );
}
